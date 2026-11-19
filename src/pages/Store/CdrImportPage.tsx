import { useRef, useState, type ChangeEvent } from 'react';
import {
  importDidCdr,
  CdrAlreadyImportedError,
  getApiErrorMessage,
} from '../../services/api/userService';
import type { CdrImportResult } from '../../types/store';
import ImportHistory from '../../components/store/ImportHistory';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const btn =
  'inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const btnPrimary = `${btn} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`;
const btnGhost = `${btn} border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;

export default function CdrImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CdrImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ importedAt: string } | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const reset = () => {
    setResult(null);
    setError(null);
    setDuplicate(null);
  };

  // clears only the selected file (keeps the summary visible)
  const resetFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    reset();
    const f = e.target.files?.[0];
    if (!f) return setFile(null);

    if (!/\.(xlsx|csv)$/i.test(f.name)) {
      setFile(null);
      return setError('Only .xlsx or .csv files are accepted.');
    }
    if (f.size > MAX_FILE_SIZE) {
      setFile(null);
      return setError('File must be 10 MB or less.');
    }
    setFile(f);
  };

  const upload = async (force = false) => {
    if (!file) return;
    reset();
    setLoading(true);
    try {
      setResult(await importDidCdr(file, force));
      setHistoryKey((k) => k + 1);
      resetFile();
    } catch (err) {
      if (err instanceof CdrAlreadyImportedError) {
        setDuplicate({ importedAt: err.importedAt }); // file stays selected
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    resetFile();
    reset();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 text-gray-800">
      <h1 className="text-2xl font-semibold">Import call records</h1>
      <p className="mb-5 mt-1 text-gray-500">
        Upload your CDR export. Only answered calls on your numbers are saved and billed.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label
          className={`relative flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-200 px-4 py-8 text-center transition focus-within:border-blue-500 ${loading
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-blue-500 hover:bg-blue-50/40'
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={onPick}
            disabled={loading}
            className="sr-only"
          />
          <span className="font-medium">{file ? 'Choose a different file' : 'Choose a file'}</span>
          <span className="text-sm text-gray-500">.xlsx or .csv, up to 10 MB</span>
        </label>

        {file && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <span className="truncate">
              {file.name}
              <span className="ml-2 text-gray-500">{formatSize(file.size)}</span>
            </span>
            {!loading && (
              <button className={btnGhost} onClick={clearFile}>
                Remove
              </button>
            )}
          </div>
        )}

        <div className="mt-4">
          <button className={btnPrimary} disabled={!file || loading} onClick={() => upload(false)}>
            {loading ? 'Importing…' : 'Import'}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {duplicate && (
          <div
            role="alertdialog"
            className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <p className="mb-3">
              This file was already imported on {new Date(duplicate.importedAt).toLocaleString()}.
              Calls already saved are never billed twice. Import it again?
            </p>
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={loading} onClick={() => upload(true)}>
                Import again
              </button>
              <button className={btnGhost} onClick={() => setDuplicate(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {result && <ImportSummary data={result} onClose={() => setResult(null)} />}
      <ImportHistory refreshKey={historyKey} />
    </div>
  );
}

function ImportSummary({ data, onClose }: { data: CdrImportResult; onClose: () => void }) {
  const nothingNew = data.inserted === 0;

  const stats: { label: string; value: number; bad?: boolean }[] = [
    { label: 'Saved', value: data.inserted },
    { label: 'Already existed', value: data.duplicates },
    { label: 'Skipped (unanswered)', value: data.skippedNoAnswer },
    { label: 'Unmatched numbers', value: data.unmatched },
    { label: 'Unassigned', value: data.unassigned },
    { label: 'Unpriced', value: data.unpriced },
    { label: 'Failed', value: data.failed, bad: data.failed > 0 },
  ];

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {nothingNew
              ? 'No new calls saved'
              : `${data.inserted} call${data.inserted === 1 ? '' : 's'} saved`}
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            {data.fileName} · {data.totalRows} rows ·{' '}
            {new Date(data.periodStart).toLocaleDateString()} to{' '}
            {new Date(data.periodEnd).toLocaleDateString()}
          </p>
        </div>
        <button className={btnGhost} onClick={onClose}>
          Close
        </button>
      </div>

      {nothingNew && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Every answered call in this file was already in your records.
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 px-3.5 py-3">
            <dt className="text-xs text-gray-500">{s.label}</dt>
            <dd className={`mt-0.5 text-2xl font-semibold ${s.bad ? 'text-red-600' : ''}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {data.rowErrors.length > 0 && (
        <details className="mt-4 rounded-lg border border-gray-200">
          <summary className="cursor-pointer px-4 py-3 font-medium">
            {data.rowErrors.length} row errors
          </summary>
          <pre className="overflow-auto border-t border-gray-200 p-4 text-xs">
            {JSON.stringify(data.rowErrors, null, 2)}
          </pre>
        </details>
      )}

      {data.unmatchedNumbers.length > 0 && (
        <details className="mt-4 rounded-lg border border-gray-200">
          <summary className="cursor-pointer px-4 py-3 font-medium">
            Unmatched numbers ({data.unmatchedNumbers.length})
          </summary>
          <div className="max-h-80 overflow-auto border-t border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Number</th>
                  <th className="px-4 py-2 text-right font-semibold">Calls</th>
                </tr>
              </thead>
              <tbody>
                {data.unmatchedNumbers.map((n) => (
                  <tr key={n._id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{n.number}</td>
                    <td className="px-4 py-2 text-right">{n.calls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
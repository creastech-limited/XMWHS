import React from 'react';
import { Card } from './ui';

interface AgentStatCardsProps {
  totalAgents: number;
  activeAgents: number;
  transactionsToday?: number;
  pendingInvitations?: number;
  didAgents?: number;
  showDID?: boolean;
}

type Note = { text: string; tone?: 'ok' | 'warn' };

const DOT = { ok: 'bg-emerald-500', warn: 'bg-amber-500' };

const Stat: React.FC<{ label: string; value: React.ReactNode; note?: Note }> = ({ label, value, note }) => (
  <Card className="p-4">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    {note && (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
        {note.tone && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT[note.tone]}`} />}
        {note.text}
      </p>
    )}
  </Card>
);

const AgentStatCards: React.FC<AgentStatCardsProps> = ({
  totalAgents,
  activeAgents,
  didAgents = 0,
  transactionsToday = 0,
  pendingInvitations = 0,
  showDID = false,
}) => {
  const inactive = totalAgents - activeAgents;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <Stat
        label="Total agents"
        value={totalAgents}
        note={
          inactive === 0
            ? { text: 'All in good standing', tone: 'ok' }
            : { text: 'Some agents are inactive', tone: 'warn' }
        }
      />
      <Stat
        label="Active"
        value={
          <>
            {activeAgents}
            <span className="ml-1 text-sm font-normal text-slate-500">of {totalAgents}</span>
          </>
        }
        note={
          inactive > 0
            ? { text: `${inactive} inactive`, tone: 'warn' }
            : { text: 'No inactive agents', tone: 'ok' }
        }
      />
      {showDID && (
        <Stat
          label="DID agents"
          value={
            <>
              {didAgents}
              <span className="ml-1 text-sm font-normal text-slate-500">of {totalAgents}</span>
            </>
          }
          note={{ text: `${totalAgents - didAgents} without DID` }}
        />
      )}
      <Stat label="Transactions today" value={transactionsToday} note={{ text: 'Across all agents' }} />
      <Stat label="Pending invitations" value={pendingInvitations} />
    </div>
  );
};

export default AgentStatCards;
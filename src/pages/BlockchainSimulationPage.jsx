import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import MotionButton from '../components/MotionButton';

function BlockchainSimulationPage() {
  const navigate = useNavigate();
  
  const defaultData = "System Admin -> Aarav Sharma | 1200 | settled";
  const [data, setData] = useState(defaultData);
  const [nonce, setNonce] = useState(0);
  const [hash, setHash] = useState('');
  const [isMining, setIsMining] = useState(false);
  
  // Define difficulty: Hash must start with '000'
  const prefixTarget = "000"; 
  const miningRef = useRef(false);

  // Compute live hash when data or nonce changes
  useEffect(() => {
    const computeCurrent = async () => {
      if (!data) {
        setHash('');
        return;
      }
      const payload = `${data}${nonce}`;
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHash(hashHex);
    };
    computeCurrent();
  }, [data, nonce]);

  const isMined = hash.startsWith(prefixTarget);

  const mineBlock = async () => {
    setIsMining(true);
    miningRef.current = true;
    let currentNonce = 0; // Reset nonce to start from scratch

    const attempt = async () => {
      if (!miningRef.current) return;
      
      const payload = `${data}${currentNonce}`;
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex.startsWith(prefixTarget)) {
        setNonce(currentNonce);
        setIsMining(false);
        miningRef.current = false;
        return; 
      }
      
      currentNonce++;
      
      // Update the UI intermittently to show fast spinning numbers without freezing the browser
      if (currentNonce % 50 === 0) {
        setNonce(currentNonce);
        // Yield to browser event loop
        setTimeout(attempt, 0); 
      } else {
        // Fast synchronous loop for the intermediate numbers
        attempt();
      }
    };

    attempt();
  };

  const handleStop = () => {
    miningRef.current = false;
    setIsMining(false);
  }

  useEffect(() => {
    return () => {
      miningRef.current = false;
    }
  }, []);

  return (
    <div className="space-y-6">
      <GlassCard accent={isMining ? 'amber' : (isMined ? 'green' : 'red')}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Forensics Lab</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Proof-of-Work Mining Sandbox</h2>
            <p className="mt-3 max-w-3xl text-slate-300 leading-7">
              Blockchain trust is enforced mathematically through <strong>mining</strong>. A valid block's hash MUST begin with the network difficulty target (e.g. "{prefixTarget}"). If you mutate the data, the delicate hash shatters and you fall out of consensus. Run the Proof-of-Work algorithm below to search for a new "Nonce" variable that mathematically secures the block!
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/25 px-5 py-4 text-slate-100 flex-shrink-0 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Difficulty Target</p>
            <p className="mt-2 text-2xl font-mono text-cyan-400 font-bold tracking-widest">{prefixTarget}</p>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-center mt-8">
        <GlassCard accent={isMining ? 'amber' : (isMined ? 'green' : 'red')} className={`w-full max-w-3xl transition-all duration-500 shadow-[0_0_80px_rgba(0,0,0,0.5)] ${isMined ? 'border-emerald-500/50 shadow-[0_0_100px_rgba(16,185,129,0.15)] bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20'}`}>
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
             <p className="text-xl font-bold text-white tracking-widest uppercase">Block #1105</p>
             <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg ${isMined ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : (isMining ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-rose-500/20 text-rose-300 border border-rose-500/50')}`}>
                {isMining ? 'Calculating Hash...' : (isMined ? 'Secured (Mined)' : 'Unverified (Compromised)')}
             </span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold mb-2 block">Ledger Data (Try editing!)</label>
              <textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={isMining}
                className="w-full h-[80px] rounded-xl border border-white/10 bg-slate-950/80 p-4 text-base font-mono text-sky-200 focus:border-sky-500/50 outline-none transition-colors shadow-inner resize-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold mb-2 block">Nonce (Random variable)</label>
              <input
                type="number"
                value={nonce}
                onChange={(e) => setNonce(Number(e.target.value))}
                disabled={isMining}
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-4 text-base font-mono text-purple-300 focus:border-purple-500/50 outline-none transition-colors shadow-inner disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold mb-2 block">Cryptographic Hash (SHA-256)</label>
              <div className={`w-full rounded-xl border p-5 text-lg font-mono tracking-wider break-all transition-colors duration-300 shadow-inner ${isMined ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold' : (isMining ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300')}`}>
                {hash}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            {!isMining ? (
              <MotionButton
                onClick={mineBlock}
                className={`w-full py-4 rounded-xl border font-bold tracking-widest uppercase text-sm ${isMined ? 'border-sky-400/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20' : 'border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'}`}
              >
                {isMined ? 'Recalculate Proof of Work' : 'Execute Mining Algorithm'}
              </MotionButton>
            ) : (
               <MotionButton
               onClick={handleStop}
               className="w-full py-4 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 font-bold tracking-widest uppercase text-sm animate-pulse hover:bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
             >
               Stop Mining (Current Nonce: {nonce})
             </MotionButton>
            )}
            
            <MotionButton
                onClick={() => navigate('/attacks')}
                className="whitespace-nowrap py-4 px-6 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 font-bold tracking-widest uppercase text-sm"
              >
                Threat Center
            </MotionButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default BlockchainSimulationPage;


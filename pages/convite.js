import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, XCircle, Loader2, QrCode } from 'lucide-react';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function PaginaConvite() {
  const [convidado, setConvidado] = useState(null);
  const [etapa, setEtapa] = useState('carregando'); // carregando, rsvp, finalizado
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      supabase.from('convidados').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (data) {
            setConvidado(data);
            setEtapa(data.rsvp === 'pendente' ? 'rsvp' : 'finalizado');
          }
        });
    }
  }, []);

  const confirmarPresenca = async (status) => {
    setLoading(true);
    const { error } = await supabase.from('convidados').update({ rsvp: status }).eq('id', convidado.id);
    if (!error) {
      setConvidado({...convidado, rsvp: status});
      setEtapa('finalizado');
    }
    setLoading(false);
  };

  if (etapa === 'carregando') return <div className="min-h-screen bg-[#7e7f7f] flex items-center justify-center text-white">Carregando convite...</div>;

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl text-center">
        <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[120px] mx-auto mb-8" alt="Logo" />
        
        {etapa === 'rsvp' && (
          <>
            <h1 className="text-gray-500 font-bold text-xl uppercase tracking-widest mb-2">Olá, {convidado.nome}!</h1>
            <p className="text-gray-400 text-sm mb-10 italic">Você confirma sua presença neste evento especial?</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => confirmarPresenca('confirmado')}
                disabled={loading}
                className="w-full bg-[#8da38d] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin"/> : <CheckCircle size={20}/>} SIM, ESTAREI PRESENTE
              </button>
              
              <button 
                onClick={() => confirmarPresenca('recusado')}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                INFELIZMENTE NÃO POSSO IR
              </button>
            </div>
          </>
        )}

        {etapa === 'finalizado' && (
          <div className="animate-in fade-in duration-700">
            {convidado.rsvp === 'confirmado' ? (
              <>
                <div className="text-green-500 mb-4 flex justify-center"><CheckCircle size={60}/></div>
                <h2 className="text-gray-600 font-bold text-lg uppercase mb-2">Presença Confirmada!</h2>
                <p className="text-gray-400 text-xs mb-8 uppercase tracking-tighter">Apresente este QR Code na entrada:</p>
                <div className="bg-gray-50 p-4 rounded-3xl inline-block shadow-inner border border-gray-100">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${convidado.id}`} 
                    alt="QR Code Convite"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-[10px] text-gray-300 mt-6 uppercase tracking-widest">Mal podemos esperar para te ver!</p>
              </>
            ) : (
              <>
                <div className="text-gray-300 mb-4 flex justify-center"><XCircle size={60}/></div>
                <h2 className="text-gray-400 font-bold text-lg uppercase">Sentiremos sua falta!</h2>
                <p className="text-gray-400 text-sm mt-4 italic">Agradecemos por nos avisar.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function PaginaConvite() {
  const [convidado, setConvidado] = useState(null);
  const [etapa, setEtapa] = useState('carregando'); 
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

  const responder = async (status) => {
    setLoading(true);
    await supabase.from('convidados').update({ rsvp: status }).eq('id', convidado.id);
    setConvidado({...convidado, rsvp: status});
    setEtapa('finalizado');
    setLoading(false);
  };

  if (etapa === 'carregando') return <div className="min-h-screen bg-[#7e7f7f] flex items-center justify-center text-white italic uppercase text-xs tracking-widest">Carregando convite...</div>;

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl text-center">
        <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[120px] mx-auto mb-8" alt="Logo" />
        
        {etapa === 'rsvp' && (
          <>
            <h1 className="text-gray-500 font-bold text-lg uppercase tracking-widest mb-2">Olá, {convidado.nome}!</h1>
            <p className="text-gray-400 text-xs mb-10 italic uppercase">Você confirma sua presença neste evento?</p>
            <div className="space-y-3">
              <button onClick={() => responder('confirmado')} disabled={loading} className="w-full bg-[#8da38d] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xs">SIM, EU VOU!</button>
              <button onClick={() => responder('recusado')} disabled={loading} className="w-full bg-gray-50 text-gray-400 font-bold py-4 rounded-2xl text-xs">NÃO PODEREI IR</button>
            </div>
          </>
        )}

        {etapa === 'finalizado' && (
          <div className="animate-in fade-in duration-1000">
            {convidado.rsvp === 'confirmado' ? (
              <>
                <div className="text-green-500 mb-4 flex justify-center"><CheckCircle size={50}/></div>
                <h2 className="text-gray-600 font-bold text-sm uppercase mb-6 tracking-widest">Presença Confirmada!</h2>
                <div className="bg-white p-4 rounded-3xl inline-block shadow-md border border-gray-50">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${convidado.id}`} alt="QR Code" className="w-40 h-40" />
                </div>
                <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-widest">Apresente este código na entrada.</p>
              </>
            ) : (
              <>
                <div className="text-gray-200 mb-4 flex justify-center"><XCircle size={50}/></div>
                <h2 className="text-gray-400 font-bold text-sm uppercase tracking-widest">Agradecemos o aviso!</h2>
                <p className="text-gray-400 text-[10px] mt-4 uppercase italic">Sentiremos sua falta no evento.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

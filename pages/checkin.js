import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, UserCheck, UserX, Loader2 } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Checkin() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(onScanSuccess);

    async function onScanSuccess(decodedText) {
      scanner.clear();
      setLoading(true);
      const { data } = await supabase.from('convidados').update({ status: true }).eq('id', decodedText).select().single();
      if (data) { setResultado({ success: true, nome: data.nome, mesa: data.mesa }); }
      else { setResultado({ success: false, msg: "Convidado não encontrado!" }); }
      setLoading(false);
    }
    return () => scanner.clear();
  }, []);

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-8 pt-6">
          <Link href="/" className="bg-white/20 p-2 rounded-full text-white"><ArrowLeft size={20}/></Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Scanner de Entrada</h1>
        </div>
        <div className="bg-white rounded-[30px] p-6 shadow-2xl">
          {!resultado && !loading && <div id="reader"></div>}
          {loading && <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-gray-400" size={40}/></div>}
          {resultado && (
            <div className="text-center py-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${resultado.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {resultado.success ? <UserCheck size={40}/> : <UserX size={40}/>}
              </div>
              <h2 className="text-lg font-bold text-gray-700 uppercase">{resultado.nome || "ERRO"}</h2>
              <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">{resultado.mesa ? `Mesa: ${resultado.mesa}` : resultado.msg}</p>
              <button onClick={() => window.location.reload()} className="mt-8 bg-[#8da38d] text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Próximo Convidado</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, UserCheck, UserX, Loader2, Camera } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Checkin() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Configuração mais sensível para celulares
    const config = { 
      fps: 20, // Mais fotos por segundo para não perder o código
      qrbox: { width: 280, height: 280 }, // Área de leitura maior
      aspectRatio: 1.0
    };

    const scanner = new Html5QrcodeScanner("reader", config, false);
    
    scanner.render(async (decodedText) => {
      // Quando ler com sucesso:
      scanner.clear(); // Para a câmera
      setLoading(true);

      try {
        // Busca o convidado e já marca como presente (status: true)
        const { data, error } = await supabase
          .from('convidados')
          .update({ status: true })
          .eq('id', decodedText)
          .select()
          .single();

        if (data) {
          setResultado({ success: true, nome: data.nome, mesa: data.mesa });
        } else {
          setResultado({ success: false, msg: "Convite inválido ou não encontrado." });
        }
      } catch (err) {
        setResultado({ success: false, msg: "Erro na conexão com o banco." });
      } finally {
        setLoading(false);
      }
    }, (error) => {
      // Erros de busca (normal enquanto a câmera procura)
    });

    return () => {
      try { scanner.clear(); } catch (e) {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-8 pt-6">
          <Link href="/" className="bg-white/20 p-2 rounded-full text-white">
            <ArrowLeft size={20}/>
          </Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Portaria Elite</h1>
        </div>

        <div className="bg-white rounded-[40px] p-6 shadow-2xl overflow-hidden">
          {!resultado && !loading && (
            <>
              <div className="text-center mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aponte para o QR Code</p>
              </div>
              <div id="reader" className="overflow-hidden rounded-3xl border-0"></div>
            </>
          )}

          {loading && (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="animate-spin text-[#ded0b8] mb-4" size={50} />
              <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">Validando entrada...</p>
            </div>
          )}

          {resultado && (
            <div className="text-center py-10 animate-in zoom-in duration-300">
              {resultado.success ? (
                <>
                  <div className="bg-green-100 text-green-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <UserCheck size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-700 uppercase tracking-tight">{resultado.nome}</h2>
                  <div className="mt-4 inline-block bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
                    <p className="text-gray-500 font-bold text-sm">MESA: {resultado.mesa || 'LIVRE'}</p>
                  </div>
                  <div className="mt-10">
                    <button onClick={() => window.location.reload()} className="bg-[#8da38d] text-white px-10 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
                      Próximo Convidado
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-100 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <UserX size={48} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-700 uppercase">Acesso Negado</h2>
                  <p className="text-gray-400 text-sm mt-2 px-10 leading-tight italic">{resultado.msg}</p>
                  <button onClick={() => window.location.reload()} className="mt-10 bg-gray-400 text-white px-10 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                    Tentar Novamente
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-[9px] mt-8 uppercase tracking-[4px]">Sistema de Portaria Digital</p>
      </div>
    </div>
  );
}

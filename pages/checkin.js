import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ArrowLeft, UserCheck, UserX, Loader2, Camera, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Checkin() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerAtivo, setScannerAtivo] = useState(false);

  const iniciarScanner = () => {
    setScannerAtivo(true);
    // Pequeno atraso para o elemento "reader" aparecer na tela antes de iniciar
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 20, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [0] // Força apenas câmera
      }, false);

      scanner.render(async (decodedText) => {
        scanner.clear(); // Para a câmera imediatamente
        setLoading(true);

        try {
          const { data, error } = await supabase
            .from('convidados')
            .update({ status: true })
            .eq('id', decodedText)
            .select()
            .single();

          if (data) {
            setResultado({ success: true, nome: data.nome, mesa: data.mesa });
          } else {
            setResultado({ success: false, msg: "Convite não encontrado no sistema." });
          }
        } catch (err) {
          setResultado({ success: false, msg: "Erro ao conectar com o banco de dados." });
        } finally {
          setLoading(false);
        }
      }, (error) => {
        // Erro comum de busca, não precisa mostrar
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800">
      <div className="w-full max-w-md">
        
        <div className="flex items-center mb-8 pt-6">
          <Link href="/" className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition">
            <ArrowLeft size={20}/>
          </Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Leitor de Convites</h1>
        </div>

        <div className="bg-white rounded-[40px] p-6 shadow-2xl overflow-hidden min-h-[350px] flex flex-col justify-center">
          
          {!scannerAtivo && !resultado && !loading && (
            <div className="text-center py-10">
              <div className="bg-[#ded0b8]/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="text-[#ded0b8]" size={40} />
              </div>
              <h2 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-4">Pronta para a recepção?</h2>
              <button 
                onClick={iniciarScanner}
                className="bg-[#ded0b8] text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Ativar Câmera agora
              </button>
            </div>
          )}

          {scannerAtivo && !resultado && !loading && (
            <div className="animate-in fade-in duration-500">
              <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 italic">Posicione o código no quadrado</p>
              <div id="reader" className="overflow-hidden rounded-3xl border-0 bg-black"></div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="animate-spin text-[#ded0b8] mb-4" size={50} />
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Validando entrada...</p>
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
                  <p className="text-gray-400 font-bold mt-2 text-sm uppercase tracking-widest">Mesa: {resultado.mesa || 'Livre'}</p>
                  <button onClick={() => window.location.reload()} className="mt-10 bg-[#8da38d] text-white px-10 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">
                    Próxima Leitura
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-red-100 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <UserX size={48} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-700 uppercase">Acesso Negado</h2>
                  <p className="text-gray-400 text-sm mt-2">{resultado.msg}</p>
                  <button onClick={() => window.location.reload()} className="mt-10 bg-gray-400 text-white px-10 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                    Tentar Novamente
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4">
           <button onClick={() => window.location.reload()} className="text-white/40 flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest border border-white/10 px-4 py-2 rounded-full">
              <RefreshCw size={12}/> Reiniciar Sistema
           </button>
        </div>
      </div>
    </div>
  );
}

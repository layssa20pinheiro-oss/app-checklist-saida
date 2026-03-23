import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Plus, Send, User, Trash2, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Phone, QrCode, RefreshCw, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ListaConvidados() {
  // Estados da Lista
  const [lista, setLista] = useState([]);
  const [nome, setNome] = useState('');
  const [mesa, setMesa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados da Portaria (Fusão)
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannerAtivo, setScannerAtivo] = useState(false);

  useEffect(() => { 
    carregarLista(); 
  }, []);

  async function carregarLista() {
    const { data } = await supabase.from('convidados').select('*').order('nome');
    if (data) setLista(data);
  }

  const addConvidado = async () => {
    if (!nome) return;
    setLoading(true);
    const telLimpo = telefone.replace(/\D/g, '');
    const { error } = await supabase.from('convidados').insert([{ nome, mesa, telefone: telLimpo, rsvp: 'pendente' }]);
    if (error) { alert("Erro ao salvar: " + error.message); }
    else { setNome(''); setMesa(''); setTelefone(''); carregarLista(); }
    setLoading(false);
  };

  const deletar = async (id) => {
    if (confirm("Remover convidado da lista?")) {
      await supabase.from('convidados').delete().eq('id', id);
      carregarLista();
    }
  };

  const enviarConvite = (c) => {
    const link = `${window.location.origin}/convite?id=${c.id}`;
    const texto = `Olá *${c.nome}*! ✨\n\nÉ um prazer convidar você para o nosso evento. Por favor, confirme sua presença no link abaixo para gerar seu QR Code de entrada:\n\n🔗 ${link}`;
    if (c.telefone) {
      const telDestino = c.telefone.startsWith('55') ? c.telefone : `55${c.telefone}`;
      window.open(`https://wa.me/${telDestino}?text=${encodeURIComponent(texto)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  // Lógica da Portaria (Fusão)
  const iniciarScanner = () => {
    setScannerAtivo(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 20, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, supportedScanTypes: [0]
      }, false);

      scanner.render(async (decodedText) => {
        scanner.clear();
        setScanLoading(true);
        try {
          const { data, error } = await supabase
            .from('convidados')
            .update({ status: true }) // Marca como PRESENTE
            .eq('id', decodedText).select().single();

          if (data) { 
            setScanResult({ success: true, nome: data.nome, mesa: data.mesa }); 
            // Atualiza a lista local para mostrar que ele chegou
            carregarLista();
          }
          else { setScanResult({ success: false, msg: "Convite não encontrado." }); }
        } catch (err) { setScanResult({ success: false, msg: "Erro de conexão." }); }
        finally { setScanLoading(false); }
      }, (error) => {});
    }, 300);
  };

  const fecharScanner = () => {
    setShowScanner(false);
    setScanResult(null);
    setScannerAtivo(false);
    // Garante que o scanner parou
    try {
        const scannerEl = document.getElementById('reader');
        if (scannerEl) scannerEl.innerHTML = "";
    } catch(e) {}
  };

  // Cálculos
  const total = lista.length;
  const confirmados = lista.filter(c => c.rsvp === 'confirmado').length;
  const pendentes = lista.filter(c => c.rsvp === 'pendente').length;
  const presentes = lista.filter(c => c.status === true).length;

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        
        {/* CABEÇALHO ATUALIZADO COM ÍCONE DE QR */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <div className="flex items-center">
            <Link href="/" className="bg-white/20 p-2 rounded-full text-white"><ArrowLeft size={20}/></Link>
            <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Convidados Elite</h1>
          </div>
          {!showScanner && (
            <button 
                onClick={() => { setShowScanner(true); setScannerAtivo(false); setScanResult(null); }}
                className="bg-[#ded0b8] p-3 rounded-2xl text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 group"
            >
                <QrCode size={20}/>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:block transition-all">Abrir Portaria</span>
            </button>
          )}
          {showScanner && (
            <button onClick={fecharScanner} className="bg-white p-3 rounded-2xl text-gray-500 font-bold text-xs uppercase shadow-md">
                Fechar
            </button>
          )}
        </div>

        {/* --- TELA DA PORTARIA (SE ATIVO) --- */}
        {showScanner && (
            <div className="bg-white rounded-[40px] p-6 shadow-2xl overflow-hidden min-h-[350px] flex flex-col justify-center mb-10 animate-in slide-in-from-top duration-500">
            
            {!scannerAtivo && !scanResult && !scanLoading && (
                <div className="text-center py-10">
                <div className="bg-[#ded0b8]/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <QrCode className="text-[#ded0b8]" size={40} />
                </div>
                <h2 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-4">Pronta para a recepção?</h2>
                <button 
                    onClick={iniciarScanner}
                    className="bg-[#ded0b8] text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
                >
                    Ativar Câmera Portaria
                </button>
                </div>
            )}

            {scannerAtivo && !scanResult && !scanLoading && (
                <div className="animate-in fade-in duration-500">
                <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 italic">Aponte para o código do convidado</p>
                <div id="reader" className="overflow-hidden rounded-3xl border-0 bg-black"></div>
                </div>
            )}

            {scanLoading && (
                <div className="flex flex-col items-center py-20">
                <Loader2 className="animate-spin text-[#ded0b8] mb-4" size={50} />
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Validando entrada...</p>
                </div>
            )}

            {scanResult && (
                <div className="text-center py-10 animate-in zoom-in duration-300">
                {scanResult.success ? (
                    <>
                    <div className="bg-green-100 text-green-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <UserCheck size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700 uppercase tracking-tight">{scanResult.nome}</h2>
                    <p className="text-gray-400 font-bold mt-2 text-sm uppercase tracking-widest">Mesa: {scanResult.mesa || 'Livre'}</p>
                    <p className="text-green-500 text-[10px] uppercase font-bold mt-3">✅ Check-in realizado!</p>
                    <button onClick={fecharScanner} className="mt-10 bg-gray-100 text-gray-500 px-10 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                        Voltar para a Lista
                    </button>
                    </>
                ) : (
                    <>
                    <div className="bg-red-100 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <UserX size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 uppercase">Acesso Negado</h2>
                    <p className="text-gray-400 text-sm mt-2">{scanResult.msg}</p>
                    <button onClick={fecharScanner} className="mt-10 bg-gray-400 text-white px-10 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                        Voltar e tentar novamente
                    </button>
                    </>
                )}
                </div>
            )}
            </div>
        )}

        {/* --- TELA DA LISTA (SE SCANNER NÃO ATIVO) --- */}
        {!showScanner && (
            <div className="animate-in fade-in duration-500">
                {/* CONTADOR DE RESUMO ATUALIZADO COM PRESENTES */}
                <div className="grid grid-cols-4 gap-2 mb-6 text-center text-white">
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-3">
                        <p className="text-[9px] uppercase tracking-tighter opacity-70">Total</p>
                        <p className="text-lg font-bold">{total}</p>
                    </div>
                    <div className="bg-[#ded0b8]/40 border border-[#ded0b8]/50 rounded-2xl p-3">
                        <p className="text-[9px] uppercase tracking-tighter opacity-90">Confirm</p>
                        <p className="text-lg font-bold">{confirmados}</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-3">
                        <p className="text-[9px] uppercase tracking-tighter opacity-70">Penden</p>
                        <p className="text-lg font-bold">{pendentes}</p>
                    </div>
                    <div className="bg-[#8da38d] rounded-2xl p-3 shadow-lg">
                        <p className="text-[9px] uppercase tracking-tighter opacity-90">Presentes</p>
                        <p className="text-lg font-bold">{presentes}</p>
                    </div>
                </div>

                <div className="bg-white rounded-[30px] p-6 shadow-xl mb-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b">
                            <User size={16} className="text-gray-300"/>
                            <input className="flex-1 p-2 outline-none text-sm" placeholder="Nome do Convidado" value={nome} onChange={e => setNome(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 border-b">
                            <Phone size={16} className="text-gray-300"/>
                            <input className="flex-1 p-2 outline-none text-sm" placeholder="WhatsApp (DDD + Número)" value={telefone} onChange={e => setTelefone(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 border-b">
                            <Clock size={16} className="text-gray-300"/>
                            <input className="flex-1 p-2 outline-none text-sm" placeholder="Mesa (Opcional)" value={mesa} onChange={e => setMesa(e.target.value)} />
                        </div>
                        <button onClick={addConvidado} className="w-full bg-[#ded0b8] p-4 rounded-2xl text-white font-bold text-xs uppercase tracking-widest flex justify-center shadow-md active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin"/> : "Adicionar à Lista"}
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pb-20">
                    {lista.map(c => (
                        <div key={c.id} className={`bg-white p-4 rounded-2xl flex items-center justify-between shadow-md border-l-4 ${c.status === true ? 'border-green-400' : 'border-[#ded0b8]'}`}>
                            <div className="flex items-center gap-3">
                                {c.status === true ? (
                                    <UserCheck className="text-green-500" size={18}/> // Ícone de Presente
                                ) : (
                                    c.rsvp === 'confirmado' ? <CheckCircle className="text-green-300" size={18}/> : c.rsvp === 'recusado' ? <XCircle className="text-red-200" size={18}/> : <Clock className="text-gray-200" size={18}/>
                                )}
                                <div>
                                    <p className={`font-bold text-gray-600 text-sm uppercase leading-tight ${c.status === true && 'text-green-700'}`}>{c.nome}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                        {c.telefone ? `Tel: ${c.telefone}` : 'Sem Tel'} {c.mesa && ` | Mesa: ${c.mesa}`} {c.status === true && ' | ✅ PRESENTE'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => enviarConvite(c)} className="text-[#25D366] p-2 hover:bg-green-50 rounded-full transition-colors"><Send size={18}/></button>
                                <button onClick={() => deletar(c.id)} className="text-gray-200 p-2 hover:text-red-300 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {lista.length === 0 && (
            <p className="text-center text-white/40 italic py-10">Sua lista está vazia.</p>
          )}
        </div>
            </div>
        )}

      </div>
    </div>
  );
}

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Plus, Send, Trash2, ArrowLeft, Loader2, Clock, QrCode, UserCheck } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ListaConvidados() {
  const router = useRouter();
  const { id } = router.query; // PADRONIZADO PARA ID

  const [lista, setLista] = useState([]);
  const [nome, setNome] = useState('');
  const [mesa, setMesa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => { if (id) carregarLista(); }, [id]);

  async function carregarLista() {
    const { data } = await supabase.from('convidados').select('*').eq('evento_id', id).order('nome');
    if (data) setLista(data);
  }

  const addConvidado = async () => {
    if (!nome || !id) return;
    setLoading(true);
    const telLimpo = telefone.replace(/\D/g, '');
    await supabase.from('convidados').insert([{ nome, mesa, telefone: telLimpo, rsvp: 'pendente', evento_id: id }]);
    setNome(''); setMesa(''); setTelefone(''); carregarLista();
    setLoading(false);
  };

  const total = lista.length;
  const confirmados = lista.filter(c => c.rsvp === 'confirmado').length;
  const presentes = lista.filter(c => c.status === true).length;

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 pt-6">
          <Link href={`/menu-evento?id=${id}`} className="bg-white/20 p-2 rounded-full text-white"><ArrowLeft size={20}/></Link>
          <h1 className="text-white font-bold uppercase tracking-widest text-xs">Convidados</h1>
          <button onClick={() => setShowScanner(true)} className="bg-[#ded0b8] p-2 rounded-xl text-white shadow-lg"><QrCode size={20}/></button>
        </div>

        {showScanner ? (
            <div className="bg-white rounded-[30px] p-6 shadow-2xl mb-10">
                <div id="reader"></div>
                <button onClick={() => setShowScanner(false)} className="w-full mt-4 bg-gray-100 py-3 rounded-xl text-[10px] font-bold uppercase text-gray-400">Fechar Câmera</button>
            </div>
        ) : (
            <>
                <div className="grid grid-cols-3 gap-2 mb-6 text-center text-white">
                    <div className="bg-white/10 rounded-2xl p-2"><p className="text-[8px] uppercase">Total</p><p className="font-bold">{total}</p></div>
                    <div className="bg-white/10 rounded-2xl p-2"><p className="text-[8px] uppercase">Confirm</p><p className="font-bold">{confirmados}</p></div>
                    <div className="bg-[#8da38d] rounded-2xl p-2 shadow-lg"><p className="text-[8px] uppercase font-bold">Presentes</p><p className="font-bold">{presentes}</p></div>
                </div>

                <div className="bg-white rounded-[30px] p-6 shadow-xl mb-6">
                    <input className="w-full border-b p-2 mb-3 outline-none text-sm" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
                    <input className="w-full border-b p-2 mb-3 outline-none text-sm" placeholder="WhatsApp" value={telefone} onChange={e => setTelefone(e.target.value)} />
                    <input className="w-full border-b p-2 mb-4 outline-none text-sm" placeholder="Mesa" value={mesa} onChange={e => setMesa(e.target.value)} />
                    <button onClick={addConvidado} className="w-full bg-[#ded0b8] text-white py-4 rounded-2xl font-bold text-xs uppercase">{loading ? <Loader2 className="animate-spin mx-auto"/> : "Adicionar Convidado"}</button>
                </div>

                <div className="space-y-3 pb-20">
                    {lista.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border-l-4 border-[#ded0b8]">
                            <div className="flex items-center gap-3">
                                {c.status ? <UserCheck className="text-green-500" size={18}/> : <Clock className="text-gray-300" size={18}/>}
                                <div><p className="font-bold text-gray-600 text-xs uppercase">{c.nome}</p><p className="text-[9px] text-gray-400">MESA: {c.mesa || '-'}</p></div>
                            </div>
                            <button onClick={() => window.open(`https://wa.me/${c.telefone}?text=${encodeURIComponent('Olá ' + c.nome + '! Confirme sua presença: ' + window.location.origin + '/convite?id=' + c.id)}`)} className="text-[#25D366] p-2"><Send size={18}/></button>
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
}

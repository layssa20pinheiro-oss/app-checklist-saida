import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Send, User, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ListaConvidados() {
  const [lista, setLista] = useState([]);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregarLista(); }, []);

  async function carregarLista() {
    const { data } = await supabase.from('convidados').select('*').order('nome');
    if (data) setLista(data);
  }

  const addConvidado = async () => {
    if (!nome) return;
    setLoading(true);
    await supabase.from('convidados').insert([{ nome, rsvp: 'pendente' }]);
    setNome('');
    carregarLista();
    setLoading(false);
  };

  const enviarConvite = (c) => {
    const link = `${window.location.origin}/convite?id=${c.id}`;
    const texto = `Olá *${c.nome}*! ✨\n\nÉ um prazer convidar você para o nosso evento. Por favor, confirme sua presença no link abaixo para gerar seu QR Code de entrada:\n\n🔗 ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/" className="bg-white/20 p-2 rounded-full text-white"><ArrowLeft size={20}/></Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Lista de Convidados</h1>
        </div>

        <div className="bg-white rounded-[30px] p-6 shadow-xl mb-6">
          <div className="flex gap-2">
            <input 
              className="flex-1 border-b p-2 outline-none text-sm" 
              placeholder="Nome do Convidado..." 
              value={nome} 
              onChange={e => setNome(e.target.value)}
            />
            <button onClick={addConvidado} className="bg-[#ded0b8] p-3 rounded-xl text-white">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {lista.map(c => (
            <div key={c.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${c.rsvp === 'confirmado' ? 'bg-green-400' : c.rsvp === 'recusado' ? 'bg-red-300' : 'bg-gray-200'}`}></div>
                <div>
                  <p className="font-bold text-gray-600 text-sm uppercase leading-none">{c.nome}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-1">{c.rsvp}</p>
                </div>
              </div>
              <button onClick={() => enviarConvite(c)} className="text-[#25D366] p-2 hover:bg-green-50 rounded-full transition-colors">
                <Send size={18}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

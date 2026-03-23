import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Send, User, Trash2, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Phone } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ListaConvidados() {
  const [lista, setLista] = useState([]);
  const [nome, setNome] = useState('');
  const [mesa, setMesa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregarLista(); }, []);

  async function carregarLista() {
    const { data } = await supabase.from('convidados').select('*').order('nome');
    if (data) setLista(data);
  }

  const addConvidado = async () => {
    if (!nome) return;
    setLoading(true);
    const telLimpo = telefone.replace(/\D/g, '');
    
    // Tenta salvar e captura se houver erro
    const { error } = await supabase.from('convidados').insert([{ 
      nome, 
      mesa, 
      telefone: telLimpo, 
      rsvp: 'pendente' 
    }]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setNome(''); setMesa(''); setTelefone('');
      carregarLista();
    }
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

  const total = lista.length;
  const confirmados = lista.filter(c => c.rsvp === 'confirmado').length;
  const pendentes = lista.filter(c => c.rsvp === 'pendente').length;

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6 pt-6">
          <Link href="/" className="bg-white/20 p-2 rounded-full text-white"><ArrowLeft size={20}/></Link>
          <h1 className="text-white font-bold ml-4 uppercase tracking-widest text-sm">Lista de Convidados</h1>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-white">
            <p className="text-[9px] uppercase tracking-tighter opacity-70">Total</p>
            <p className="text-lg font-bold">{total}</p>
          </div>
          <div className="bg-[#8da38d] rounded-2xl p-3 text-white shadow-lg">
            <p className="text-[9px] uppercase tracking-tighter opacity-80">Confirmados</p>
            <p className="text-lg font-bold">{confirmados}</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-white">
            <p className="text-[9px] uppercase tracking-tighter opacity-70">Pendentes</p>
            <p className="text-lg font-bold">{pendentes}</p>
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
            <div key={c.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-md border-l-4 border-[#ded0b8]">
              <div className="flex items-center gap-3">
                {c.rsvp === 'confirmado' ? <CheckCircle className="text-green-400" size={18}/> : c.rsvp === 'recusado' ? <XCircle className="text-red-300" size={18}/> : <Clock className="text-gray-200" size={18}/>}
                <div>
                  <p className="font-bold text-gray-600 text-sm uppercase leading-tight">{c.nome}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                    {c.telefone ? `Tel: ${c.telefone}` : 'Sem Tel'} {c.mesa && ` | Mesa: ${c.mesa}`}
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
    </div>
  );
}

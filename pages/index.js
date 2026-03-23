import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Calendar, ChevronRight, Loader2, Edit2, Trash2, Users } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Home() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [novoEvento, setNovoEvento] = useState({ nome: '', data: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  useEffect(() => { carregarEventos(); }, []);

  async function carregarEventos() {
    setLoading(true);
    // Busca eventos e a contagem de convidados de cada um
    const { data } = await supabase.from('eventos').select('*, convidados(rsvp)').order('data', { ascending: true });
    if (data) setEventos(data);
    setLoading(false);
  }

  const deletarEvento = async (id, e) => {
    e.preventDefault(); // Impede de abrir o evento ao clicar na lixeira
    if (confirm("⚠️ ATENÇÃO: Isso excluirá o evento e todos os convidados e relatórios vinculados a ele. Confirma?")) {
      await supabase.from('eventos').delete().eq('id', id);
      carregarEventos();
    }
  };

  const confirmarAcaoEvento = async () => {
    if (!novoEvento.nome) return;
    setLoading(true);
    if (isEditing) {
      await supabase.from('eventos').update(novoEvento).eq('id', eventToEdit.id);
    } else {
      await supabase.from('eventos').insert([novoEvento]);
    }
    fecharModal();
    carregarEventos();
  };

  const fecharModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setNovoEvento({ nome: '', data: '' });
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[140px] mx-auto mb-10 mt-6" alt="Logo" />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white font-bold uppercase tracking-[3px] text-sm">Meus Eventos</h1>
          <button onClick={() => setShowModal(true)} className="bg-[#ded0b8] p-2 rounded-xl text-white shadow-lg active:scale-95 transition-all"><Plus size={20}/></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/50" /></div>
        ) : (
          <div className="space-y-4">
            {eventos.map(ev => {
                const totalConv = ev.convidados?.length || 0;
                const confirmados = ev.convidados?.filter(c => c.rsvp === 'confirmado').length || 0;

                return (
                    <div key={ev.id} className="relative group">
                        <Link href={`/menu-evento?id=${ev.id}`} className="block bg-white p-5 rounded-[30px] shadow-xl hover:scale-[1.01] transition-all">
                        <div className="flex justify-between items-center pr-12">
                            <div>
                                <h3 className="font-bold text-gray-700 uppercase tracking-tight text-sm leading-tight">{ev.nome}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase">
                                        <Calendar size={10} /> {ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : '--/--'}
                                    </span>
                                    {/* PRÉVIA DELICADA DE CONVIDADOS */}
                                    <span className="flex items-center gap-1 text-[9px] text-[#8da38d] font-bold uppercase border-l pl-3 border-gray-100">
                                        <Users size={10} /> {totalConv} <span className="text-gray-300 font-normal">({confirmados} OK)</span>
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="text-[#ded0b8]" size={18} />
                        </div>
                        </Link>
                        
                        {/* BOTÕES DE AÇÃO */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                            <button onClick={() => { setEventToEdit(ev); setNovoEvento({nome: ev.nome, data: ev.data}); setIsEditing(true); setShowModal(true); }} className="text-gray-200 hover:text-[#ded0b8] p-2"><Edit2 size={14}/></button>
                            <button onClick={(e) => deletarEvento(ev.id, e)} className="text-gray-200 hover:text-red-300 p-2"><Trash2 size={14}/></button>
                        </div>
                    </div>
                )
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white w-full max-w-xs rounded-[35px] p-8 shadow-2xl animate-in zoom-in duration-300">
              <h2 className="text-center font-bold text-gray-500 uppercase text-xs tracking-widest mb-6">{isEditing ? "Editar Evento" : "Novo Evento"}</h2>
              <input className="w-full border-b p-3 mb-4 outline-none text-sm" placeholder="Nome do Evento" value={novoEvento.nome} onChange={e => setNovoEvento({...novoEvento, nome: e.target.value})} />
              <input type="date" className="w-full border-b p-3 mb-8 outline-none text-sm text-gray-400" value={novoEvento.data} onChange={e => setNovoEvento({...novoEvento, data: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={fecharModal} className="flex-1 text-gray-400 font-bold py-3 text-[10px] uppercase">Sair</button>
                <button onClick={confirmarAcaoEvento} className="flex-2 bg-[#8da38d] text-white px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

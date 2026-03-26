import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Calendar, ChevronRight, Loader2, Edit2, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Home() {
  const [reportPublico, setReportPublico] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [novoEvento, setNovoEvento] = useState({ nome: '', data: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('id');
    if (reportId) {
      supabase.from('checklists').select('*').eq('id', reportId).single().then(({ data }) => {
        setReportPublico(data);
        setLoading(false);
      });
    } else {
      carregarEventos();
    }
  }, []);

  async function carregarEventos() {
    setLoading(true);
    const { data } = await supabase.from('eventos').select('*, convidados(id)').order('data', { ascending: true });
    if (data) setEventos(data);
    setLoading(false);
  }

  const salvarEvento = async () => {
    if (!novoEvento.nome) return;
    if (isEditing) {
      await supabase.from('eventos').update(novoEvento).eq('id', eventToEdit.id);
    } else {
      await supabase.from('eventos').insert([novoEvento]);
    }
    setNovoEvento({ nome: '', data: '' });
    setShowModal(false);
    setIsEditing(false);
    carregarEventos();
  };

  const deletarEvento = async (id, e) => {
    e.preventDefault();
    if (confirm("Excluir este evento e TUDO o que há nele?")) {
      await supabase.from('eventos').delete().eq('id', id);
      carregarEventos();
    }
  };

  if (reportPublico) {
    return (
      <div className="min-h-screen bg-[#7e7f7f] p-6 flex flex-col items-center font-sans">
        <Head><title>Relatório | Cerimonial Elite</title><link rel="icon" href="/icon.png" /></Head>
        <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[150px] mb-8 mt-10" />
        <div className="w-full max-w-md bg-white rounded-[35px] p-8 shadow-2xl text-gray-700">
           <h2 className="text-[#7e7f7f] text-center font-bold text-xl mb-8 uppercase tracking-[5px]">Relatório Digital</h2>
           <div className="space-y-4 text-sm border-t pt-6">
              <p><strong>EVENTO:</strong> {reportPublico.evento}</p>
              <p><strong>LOCAL:</strong> {reportPublico.local}</p>
              <div className="border-t pt-4 font-bold uppercase text-[10px] text-gray-400">Itens Recolhidos:</div>
              <ul className="space-y-1 italic text-gray-500">{reportPublico.itens?.map((it, i) => <li key={i}>• {it}</li>)}</ul>
              <p className="border-t pt-4 italic"><strong>RESPONSÁVEL:</strong> {reportPublico.responsavel}</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-6 font-sans">
      <Head><title>Cerimonial Elite</title><link rel="icon" href="/icon.png" /></Head>
      <div className="max-w-md mx-auto">
        <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[140px] mx-auto mb-10 mt-6" />
        <div className="flex justify-between items-center mb-6 text-white font-bold uppercase tracking-[3px] text-sm">
          <h1>Meus Eventos</h1>
          <button onClick={() => { setIsEditing(false); setNovoEvento({nome:'', data:''}); setShowModal(true); }} className="bg-[#ded0b8] p-2 rounded-xl shadow-lg"><Plus size={20}/></button>
        </div>
        <div className="space-y-4">
          {eventos.map(ev => (
            <div key={ev.id} className="relative">
              <Link href={`/menu-evento?id=${ev.id}`} className="block bg-white p-5 rounded-[30px] shadow-xl hover:scale-[1.01] transition-all">
                <h3 className="font-bold text-gray-700 uppercase text-xs pr-20">{ev.nome}</h3>
                <div className="flex gap-3 mt-2 text-[9px] text-gray-400 font-bold uppercase">
                   <span><Calendar size={10} className="inline mr-1"/>{ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : '--/--'}</span>
                   <span className="text-[#8da38d]"><Users size={10} className="inline mr-1"/>{ev.convidados?.length || 0} Convidados</span>
                </div>
              </Link>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                <button onClick={() => { setEventToEdit(ev); setNovoEvento({nome: ev.nome, data: ev.data}); setIsEditing(true); setShowModal(true); }} className="text-gray-200 hover:text-[#ded0b8] p-2 transition-colors"><Edit2 size={16}/></button>
                <button onClick={(e) => deletarEvento(ev.id, e)} className="text-gray-200 hover:text-red-300 p-2 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-white w-full max-w-xs rounded-[35px] p-8 shadow-2xl">
              <h2 className="text-center font-bold text-gray-500 uppercase text-xs mb-6 tracking-widest">{isEditing ? "Editar Evento" : "Novo Evento"}</h2>
              <input className="w-full border-b p-3 mb-4 outline-none text-sm" placeholder="Nome" value={novoEvento.nome} onChange={e=>setNovoEvento({...novoEvento, nome: e.target.value})} />
              <input type="date" className="w-full border-b p-3 mb-8 outline-none text-sm text-gray-400" value={novoEvento.data} onChange={e=>setNovoEvento({...novoEvento, data: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={()=>setShowModal(false)} className="flex-1 text-gray-400 font-bold text-[10px] uppercase">Sair</button>
                <button onClick={salvarEvento} className="flex-2 bg-[#8da38d] text-white px-6 py-3 rounded-2xl font-bold uppercase text-[10px]">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Plus, Camera, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function Checklist() {
  const router = useRouter();
  const { id } = router.query;
  
  const [eventoNome, setEventoNome] = useState('');
  const [local, setLocal] = useState('');
  const [presentes, setPresentes] = useState('');
  const [convidados, setConvidados] = useState('');
  const [novoItem, setNovoItem] = useState('');
  const [itens, setItens] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [assinatura, setAssinatura] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (id) {
      supabase.from('eventos').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setEventoNome(data.nome);
      });
    }
  }, [id]);

  const adicionarItem = () => {
    if (novoItem.trim() !== '') {
      setItens([...itens, novoItem]);
      setNovoItem('');
    }
  };

  const removerItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `pertences/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('fotos').upload(filePath, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('fotos').getPublicUrl(filePath);
      setFotoUrl(data.publicUrl);
    } else {
      alert("Erro ao enviar foto: " + uploadError.message);
    }
    setUploading(false);
  };

  const salvarEsboco = async () => {
    if (!eventoNome || !assinatura) {
      return alert("Preencha pelo menos o nome do Evento e a sua Assinatura.");
    }
    
    setSalvando(true);
    
    const payload = {
      evento_id: id,
      evento: eventoNome,
      local: local,
      itens: itens,
      responsavel: assinatura,
      presentes: presentes,
      convidados: convidados,
      observacoes: observacoes,
      foto_url: fotoUrl
    };

    const { data, error } = await supabase.from('checklists').insert([payload]).select();
    
    setSalvando(false);
    
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      if (data && data[0]) {
         // Redireciona para visualizar o relatório gerado
         router.push(`/?id=${data[0].id}`);
      } else {
         router.push(`/menu-evento?id=${id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 font-sans flex flex-col items-center pb-24">
      <Head><title>Novo Checklist | Cerimonial Elite</title></Head>
      
      <div className="w-full max-w-md animate-in fade-in duration-500 mt-4">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between mb-2">
          <Link href={`/menu-evento?id=${id}`} className="flex items-center gap-2 text-white hover:text-white/80 transition-all text-[10px] font-bold uppercase tracking-widest">
            <ArrowLeft size={16}/> Voltar
          </Link>
        </div>
        
        {/* LOGO */}
        <div className="flex justify-center mb-6">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="h-16 opacity-90" alt="Logo" />
        </div>

        {/* LINK PARA HISTÓRICO (O SEU TOQUE DE GÊNIO AQUI) */}
        <div className="flex justify-end mb-3 pr-2">
           <Link href={`/historico?id=${id}`} className="flex items-center gap-1 text-white/80 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-all">
             Acessar Histórico <ExternalLink size={12}/>
           </Link>
        </div>

        {/* CARTÃO BRANCO PRINCIPAL */}
        <div className="bg-white rounded-[35px] p-8 shadow-2xl">
          
          <h2 className="text-center font-bold text-gray-400 uppercase tracking-[4px] text-[11px] mb-8 mt-2">
            Novo Checklist
          </h2>

          <div className="space-y-6">
            
            {/* EVENTO E LOCAL */}
            <div>
              <input className="w-full border-b border-gray-200 py-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Evento" value={eventoNome} onChange={e => setEventoNome(e.target.value)} />
            </div>
            
            <div>
              <input className="w-full border-b border-gray-200 py-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Local" value={local} onChange={e => setLocal(e.target.value)} />
            </div>

            {/* PRESENTES E CONVIDADOS LADO A LADO */}
            <div className="flex gap-4">
              <input className="w-full border-b border-gray-200 py-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Presentes" value={presentes} onChange={e => setPresentes(e.target.value)} />
              <input className="w-full border-b border-gray-200 py-2 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Convidados" value={convidados} onChange={e => setConvidados(e.target.value)} />
            </div>

            {/* ADICIONAR ITEM */}
            <div className="pt-2">
               <div className="flex items-center border border-gray-200 rounded-2xl p-1 bg-gray-50/50 focus-within:border-[#ded0b8] transition-colors">
                 <input className="flex-1 bg-transparent px-3 outline-none text-sm text-gray-600 placeholder:text-gray-400" placeholder="Adicionar item..." value={novoItem} onChange={e => setNovoItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && adicionarItem()} />
                 <button onClick={adicionarItem} className="bg-[#ded0b8] text-white p-2.5 rounded-xl shadow-sm hover:scale-105 transition-all"><Plus size={16}/></button>
               </div>
               
               {/* LISTA DE ITENS INSERIDOS */}
               {itens.length > 0 && (
                 <ul className="mt-3 space-y-2 px-1">
                   {itens.map((item, idx) => (
                     <li key={idx} className="flex justify-between items-center text-[11px] font-medium text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <span className="flex-1">• {item}</span>
                       <button onClick={() => removerItem(idx)} className="text-gray-300 hover:text-red-400 px-2 transition-colors"><Trash2 size={14}/></button>
                     </li>
                   ))}
                 </ul>
               )}
            </div>

            {/* OBSERVAÇÕES */}
            <div className="pt-2">
              <textarea className="w-full border border-gray-200 rounded-3xl p-4 outline-none text-sm text-gray-600 placeholder:text-gray-400 min-h-[100px] resize-none focus:border-[#ded0b8] transition-colors" placeholder="Observações..." value={observacoes} onChange={e => setObservacoes(e.target.value)}></textarea>
            </div>

            {/* SUA ASSINATURA */}
            <div className="pt-2 pb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Sua Assinatura</label>
              <input className="w-full border-b border-gray-200 py-2 outline-none text-sm text-gray-600" value={assinatura} onChange={e => setAssinatura(e.target.value)} />
            </div>

            {/* FOTO DOS PERTENCES */}
            <div className="pt-2 pb-4">
              <label className="relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-[25px] cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden group">
                {uploading ? (
                   <div className="flex flex-col items-center text-gray-400 gap-2"><Loader2 className="animate-spin" size={20}/><span className="text-[9px] uppercase font-bold tracking-widest">Enviando...</span></div>
                ) : fotoUrl ? (
                   <img src={fotoUrl} className="w-full h-full object-cover opacity-90" />
                ) : (
                   <div className="flex flex-col items-center text-gray-300 group-hover:text-[#ded0b8] transition-colors gap-2">
                     <Camera size={26} />
                     <span className="text-[9px] uppercase font-bold tracking-widest">Foto dos Pertences</span>
                   </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFotoUpload} />
              </label>
            </div>

            {/* BOTAO VISUALIZAR ESBOÇO */}
            <button onClick={salvarEsboco} disabled={salvando || uploading} className="w-full bg-[#ded0b8] text-white py-4 rounded-2xl font-bold uppercase tracking-[2px] text-[11px] shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
               {salvando ? <Loader2 className="animate-spin" size={16}/> : null}
               {salvando ? "Salvando..." : "Visualizar Esboço"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

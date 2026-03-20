import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Image as ImageIcon, Edit3, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistApp() {
  const [etapa, setEtapa] = useState('form'); 
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [fotoBlob, setFotoBlob] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [imgGeradaUrl, setImgGeradaUrl] = useState('');
  const [reportId, setReportId] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({ evento: '', local: '', presentes: '', convidados: '', obs: '', responsavel: '' });

  const areaCapturaRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
      const params = new URLSearchParams(window.location.search);
      const idRel = params.get('id');
      const modoEdicao = params.get('edit') === 'true';
      
      if (idRel) {
        setReportId(idRel);
        const buscarRelatorio = async (idBusca) => {
          setLoading(true);
          const { data } = await supabase.from('checklists').select('*').eq('id', idBusca).single();
          if (data) {
            setForm(data);
            setItens(data.itens || []);
            setFotoPreview(data.foto_url);
            if (modoEdicao) {
              setIsEditing(true);
              setEtapa('form');
            } else {
              setEtapa('view');
            }
          }
          setLoading(false);
        };
        buscarRelatorio(idRel);
      }
    }
  }, []);

  const handleAddItem = () => {
    if (novoItem.trim()) {
      setItens([...itens, novoItem.trim()]);
      setNovoItem('');
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            setFotoBlob(blob);
            setFotoPreview(URL.createObjectURL(blob));
          }, 'image/jpeg', 0.8);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarTudo = async () => {
    setLoading(true);
    try {
      const elemento = areaCapturaRef.current;
      const canvas = await html2canvas(elemento, {
        scale: 2, useCORS: true, backgroundColor: "#7e7f7f", windowWidth: 500
      });
      const imagemFinalBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeArquivo = `relatorio_${Date.now()}.png`;

      await supabase.storage.from('fotos').upload(nomeArquivo, imagemFinalBlob);
      const urlImgGerada = supabase.storage.from('fotos').getPublicUrl(nomeArquivo).data.publicUrl;
      setImgGeradaUrl(urlImgGerada);

      let fotoOriginalUrl = fotoPreview;
      if (fotoBlob) {
        const nomeFoto = `original_${Date.now()}.jpg`;
        await supabase.storage.from('fotos').upload(nomeFoto, fotoBlob);
        fotoOriginalUrl = supabase.storage.from('fotos').getPublicUrl(nomeFoto).data.publicUrl;
      }

      const dadosParaSalvar = {
        evento: form.evento,
        local: form.local,
        presentes: parseInt(form.presentes) || 0,
        convidados: parseInt(form.convidados) || 0,
        itens: itens,
        obs: form.obs,
        responsavel: form.responsavel,
        foto_url: fotoOriginalUrl,
        pdf_url: urlImgGerada
      };

      if (isEditing) {
        await supabase.from('checklists').update(dadosParaSalvar).eq('id', reportId);
      } else {
        const { data } = await supabase.from('checklists').insert([dadosParaSalvar]).select();
        setReportId(data[0].id);
      }
      setEtapa('sucesso');
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    const linkDigital = `${baseUrl}/?id=${reportId}`;
    const texto = `Olá! Finalizamos a organização e conferência dos seus pertences. Tudo foi recolhido com muito cuidado por nossa equipe. Aqui está o resumo de tudo o que guardamos:

✨ *Seu Relatório Digital:* ${linkDigital}

Foi um prazer fazer parte desse sonho.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_top');
  };

  if (loading && (etapa === 'view' || etapa === 'sucesso')) return <div className="min-h-screen bg-[#7e7f7f] flex items-center justify-center text-white italic tracking-widest uppercase text-xs">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#7e7f7f] p-4 flex flex-col items-center font-sans text-slate-800 pb-10">
      
      {/* CABEÇALHO PARA ÍCONE E TÍTULO */}
      <Head>
        <title>Cerimonial & Eventos</title>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" href="/icon.png" />
      </Head>

      {etapa === 'form' && (
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-2">
            <Link href="/historico" className="text-white/60 text-[10px] font-bold flex items-center gap-1 hover:text-white transition uppercase tracking-tighter p-1">
               Ver Gerenciamento <ExternalLink size={12} />
            </Link>
          </div>
          <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[140px] mx-auto mb-6" alt="Logo" />
          <div className="bg-white rounded-[30px] p-8 shadow-xl">
            <h2 className="text-center font-bold text-gray-500 mb-6 uppercase tracking-widest text-sm">
              {isEditing ? "Editar Relatório" : "Novo Checklist"}
            </h2>
            <div className="space-y-4">
              <input className="w-full border-b p-2 outline-none" placeholder="Evento" value={form.evento} onChange={e=>setForm({...form, evento: e.target.value})} />
              <input className="w-full border-b p-2 outline-none" placeholder="Local" value={form.local} onChange={e=>setForm({...form, local: e.target.value})} />
              <div className="flex gap-4">
                <input type="number" className="w-full border-b p-2 outline-none" placeholder="Presentes" value={form.presentes} onChange={e=>setForm({...form, presentes: e.target.value})} />
                <input type="number" className="w-full border-b p-2 outline-none" placeholder="Convidados" value={form.convidados} onChange={e=>setForm({...form, convidados: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-gray-50 rounded-lg px-3" placeholder="Adicionar item..." value={novoItem} onChange={e=>setNovoItem(e.target.value)} />
                <button onClick={handleAddItem} className="bg-[#ded0b8] p-2 rounded-lg text-white"><Plus size={16}/></button>
              </div>
              <ul className="text-sm space-y-1">
                {itens.map((it, i) => <li key={i} className="bg-gray-50 p-2 rounded flex justify-between tracking-tight text-xs uppercase"> • {it} <Trash2 size={14} onClick={()=>setItens(itens.filter((_,idx)=>idx!==i))} className="text-red-300"/></li>)}
              </ul>
              <textarea className="w-full border rounded-lg p-2 text-sm" placeholder="Observações..." value={form.obs} onChange={e=>setForm({...form, obs: e.target.value})}></textarea>
              <input className="w-full border-b p-2 outline-none" placeholder="Sua Assinatura" value={form.responsavel} onChange={e=>setForm({...form, responsavel: e.target.value})} />
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#ded0b8] rounded-2xl p-4 cursor-pointer">
                <Camera className="text-gray-400 mb-1" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FOTO DOS PERTENCES</span>
                <input type="file" accept="image/*" capture="camera" className="hidden" onChange={handleFotoChange} />
                {fotoPreview && <img src={fotoPreview} className="mt-2 h-24 rounded-lg shadow-sm" alt="Preview" />}
              </label>
              <button onClick={() => setEtapa('resumo')} className="w-full bg-[#ded0b8] text-white font-bold py-4 rounded-2xl mt-4 shadow-lg active:scale-95 transition-all uppercase tracking-wider text-xs">VISUALIZAR ESBOÇO</button>
            </div>
          </div>
        </div>
      )}

      {(etapa === 'resumo' || etapa === 'view') && (
        <div className="w-full flex flex-col items-center pb-20">
          <div ref={areaCapturaRef} className="w-[400px] bg-[#7e7f7f] p-6 flex flex-col items-center">
            <img src="https://rticfwqptlxkpgawpzwf.supabase.co/storage/v1/object/public/fotos/logo.png" className="max-w-[130px] mb-6" alt="Logo" />
            <div className="w-full bg-white rounded-[25px] p-8 shadow-sm">
              <h2 className="text-[#7e7f7f] text-center font-bold text-lg mb-6 uppercase tracking-widest">Relatório</h2>
              <div className="space-y-3 text-xs text-gray-700">
                <p><strong>EVENTO:</strong> {form.evento}</p>
                <p><strong>LOCAL:</strong> {form.local}</p>
                <div className="border-t pt-2 flex justify-between">
                   <p><strong>PRESENTES:</strong> {form.presentes}</p>
                   <p><strong>CONVIDADOS:</strong> {form.convidados}</p>
                </div>
                <div className="border-t pt-2">
                  <strong>ITENS RECOLHIDOS:</strong>
                  <ul className="mt-1 space-y-1 italic text-gray-600">
                    {itens.map((it, i) => <li key={i}>• {it}</li>)}
                  </ul>
                </div>
                <p className="border-t pt-2"><strong>OBSERVAÇÕES:</strong> {form.obs || 'Nenhuma.'}</p>
                <p className="border-t pt-2 italic"><strong>RESPONSÁVEL:</strong> {form.responsavel}</p>
                {fotoPreview && <img src={fotoPreview} className="mt-5 rounded-xl w-full border border-gray-100 shadow-sm" alt="Foto" />}
              </div>
            </div>
          </div>
          {etapa === 'resumo' && (
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex gap-3 w-full max-w-lg mx-auto rounded-t-3xl border shadow-2xl z-50">
              <button onClick={() => setEtapa('form')} className="flex-1 bg-gray-50 text-gray-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border text-xs uppercase"><Edit3 size={16}/> Ajustar</button>
              <button onClick={salvarTudo} disabled={loading} className="flex-2 bg-[#8da38d] text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase">
                {loading ? <Loader2 className="animate-spin" /> : (isEditing ? "Atualizar" : "Salvar")}
              </button>
            </div>
          )}
        </div>
      )}

      {etapa === 'sucesso' && (
        <div className="w-full max-w-md bg-white rounded-[30px] p-10 shadow-2xl text-center mt-10">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-gray-500 text-xl font-bold mb-6 tracking-widest uppercase">Sucesso!</h2>
          <div className="space-y-4">
            <button onClick={shareWhatsApp} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm"><Send size={18}/> WHATSAPP</button>
            <a href={imgGeradaUrl} target="_blank" rel="noreferrer" className="w-full bg-gray-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-center shadow-md"><ImageIcon size={18}/> VER IMAGEM</a>
            <button onClick={() => { window.location.href = window.location.origin; }} className="w-full text-gray-400 font-bold py-4 text-[10px] tracking-widest uppercase">Novo Relatório</button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import { Camera, Plus, Trash2, Send, Image as ImageIcon, Loader2, ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  'https://rticfwqptlxkpgawpzwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0aWNmd3FwdGx4a3BnYXdwendmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDA2MTEsImV4cCI6MjA4OTQxNjYxMX0.vOmi-rKKxXuZ5SP7uZe81Cr0fKW_fWN4Hmuf90soijM'
);

export default function ChecklistPage() {
  const router = useRouter();
  const { eventoId } = router.query;

  const [etapa, setEtapa] = useState('form');
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [form, setForm] = useState({ evento: '', local: '', presentes: '', convidados: '', obs: '', responsavel: '' });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoBlob, setFotoBlob] = useState(null);
  const [imgGeradaUrl, setImgGeradaUrl] = useState('');
  const [reportId, setReportId] = useState('');
  const areaCapturaRef = useRef();

  const salvarRelatorio = async () => {
    if (!eventoId) return alert("Erro: Evento não identificado.");
    setLoading(true);
    
    try {
      // 1. Gerar Imagem do Checklist
      const canvas = await html2canvas(areaCapturaRef.current, { scale: 2, backgroundColor: "#7e7f7f" });
      const imagemBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const nomeImg = `rel_${Date.now()}.png`;
      await supabase.storage.from('fotos').upload(nomeImg, imagemBlob);
      const publicUrl = supabase.storage.from('fotos').getPublicUrl(nomeImg).data.publicUrl;

      // 2. Salvar no Banco vinculado ao evento_id
      const { data, error } = await supabase.from('checklists').insert([{
        ...form,
        itens,
        pdf_url: publicUrl,
        evento_id: eventoId // AQUI ESTÁ A SEPARAÇÃO POR EVENTO
      }]).select();

      if (data) {
        setReportId(data[0].id);
        setImgGeradaUrl(publicUrl);
        setEtapa('sucesso');
      }
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // ... (Adicione aqui as funções de renderização do formulário e resumo que você já tinha)

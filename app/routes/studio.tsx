import { useEffect, useMemo, useState } from 'react';
import type { MetaFunction } from 'react-router';

type Segment = { id: string; title: string; duration: number; text: string };
type Rundown = { id: string; name: string; topic: string; updatedAt: string; segments: Segment[] };

const STORAGE_KEY = 'rmv-studio-rundowns-v1';
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const meta: MetaFunction = () => [
  { title: 'RMV Studio IA — Conducteur' },
  { name: 'description', content: 'Préparez et lisez vos conducteurs radio pour Radio Miréréni Village.' },
];

export default function Studio() {
  const [name, setName] = useState('Nouvelle émission');
  const [topic, setTopic] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [saved, setSaved] = useState<Rundown[]>([]);
  const [notice, setNotice] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const totalMinutes = useMemo(() => segments.reduce((sum, item) => sum + item.duration, 0), [segments]);

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
      setSaved([]);
    }
  }, []);

  function generateRundown() {
    const subject = topic.trim() || 'les actualités et la vie à Mayotte';
    setSegments([
      { id: makeId(), title: 'Ouverture', duration: 1, text: `Ia ora na, bonjour et bienvenue sur Radio Miréréni Village. Aujourd'hui, nous parlons de ${subject}. Restez avec nous.` },
      { id: makeId(), title: 'Le sujet du jour', duration: 4, text: `Notre sujet du jour : ${subject}. Présentez ici les faits importants, le contexte local et les informations à retenir. Pensez à citer vos sources.` },
      { id: makeId(), title: 'La voix des auditeurs', duration: 3, text: `Place à vos réactions. Quelle est votre expérience de ${subject} à Mayotte ? Retrouvez les messages et témoignages recueillis par l'équipe.` },
      { id: makeId(), title: 'Agenda et services', duration: 2, text: `Voici les rendez-vous et informations pratiques de la semaine. Complétez cette partie avec les horaires, lieux et contacts vérifiés.` },
      { id: makeId(), title: 'Clôture', duration: 1, text: `Merci d'avoir suivi cette émission de Radio Miréréni Village. Retrouvez-nous bientôt. Bonne journée à toutes et à tous !` },
    ]);
    setNotice('Conducteur créé. Vous pouvez modifier chaque texte avant l’enregistrement.');
  }

  function updateSegment(id: string, field: 'title' | 'text' | 'duration', value: string) {
    setSegments((items) => items.map((item) => item.id === id ? { ...item, [field]: field === 'duration' ? Math.max(1, Number(value) || 1) : value } : item));
  }

  function saveRundown() {
    if (!segments.length) { setNotice('Créez d’abord un conducteur.'); return; }
    const item: Rundown = { id: makeId(), name: name.trim() || 'Émission sans titre', topic: topic.trim(), updatedAt: new Date().toISOString(), segments };
    const next = [item, ...saved].slice(0, 30);
    setSaved(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setNotice('Conducteur enregistré sur cet appareil.');
  }

  function exportText() {
    if (!segments.length) { setNotice('Créez d’abord un conducteur.'); return; }
    const body = [`RMV STUDIO IA — ${name}`, `Sujet : ${topic || 'À compléter'}`, `Durée estimée : ${totalMinutes} min`, '', ...segments.flatMap((s) => [`## ${s.title} (${s.duration} min)`, s.text, ''])].join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${(name || 'conducteur').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`; link.click(); URL.revokeObjectURL(url);
    setNotice('Conducteur téléchargé.');
  }

  function readAloud() {
    if (!('speechSynthesis' in window)) { setNotice('La lecture vocale n’est pas disponible dans ce navigateur.'); return; }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const text = segments.map((s) => `${s.title}. ${s.text}`).join('. ');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR'; utterance.onend = () => setSpeaking(false); utterance.onerror = () => setSpeaking(false);
    setSpeaking(true); window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
  }

  function loadRundown(item: Rundown) { setName(item.name); setTopic(item.topic); setSegments(item.segments); setNotice(`Conducteur « ${item.name} » ouvert.`); }

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-300">Radio Miréréni Village · Mayotte</p><h1 className="mt-2 text-3xl font-bold">RMV Studio <span className="text-cyan-300">IA</span></h1><p className="mt-1 text-sm text-slate-400">Atelier de préparation d’émissions</p></div>
          <a href="/" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Retour à Bolt.diy</a>
        </header>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Conducteur d’émission</h2><p className="mt-1 text-sm text-slate-400">Préparez les séquences, le minutage et le texte de lecture.</p></div><span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">{totalMinutes} min</span></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-300">Nom de l’émission<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11182b] px-4 py-3 text-white outline-none focus:border-cyan-400" placeholder="Ex. Le rendez-vous de Miréréni" /></label>
              <label className="text-sm text-slate-300">Sujet du jour<input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11182b] px-4 py-3 text-white outline-none focus:border-cyan-400" placeholder="Ex. la vie associative à Mayotte" /></label>
            </div>
            <div className="my-5 flex flex-wrap gap-2"><button onClick={generateRundown} className="rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-300">Créer un conducteur</button><button onClick={saveRundown} className="rounded-xl border border-white/15 px-4 py-2.5 hover:bg-white/5">Enregistrer</button><button onClick={exportText} className="rounded-xl border border-white/15 px-4 py-2.5 hover:bg-white/5">Exporter en .txt</button><button onClick={readAloud} disabled={!segments.length} className="rounded-xl border border-white/15 px-4 py-2.5 hover:bg-white/5 disabled:opacity-40">{speaking ? 'Arrêter la lecture' : 'Écouter le conducteur'}</button></div>
            {notice && <p role="status" className="mb-4 rounded-lg bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">{notice}</p>}
            {segments.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-slate-400">Saisissez un sujet puis créez le conducteur de votre émission.</div> : <div className="space-y-4">{segments.map((segment, index) => <article key={segment.id} className="rounded-xl border border-white/10 bg-[#10172a] p-4"><div className="mb-3 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-sm font-bold text-cyan-200">{String(index + 1).padStart(2, '0')}</span><input aria-label="Titre de la séquence" value={segment.title} onChange={(e) => updateSegment(segment.id, 'title', e.target.value)} className="min-w-0 flex-1 bg-transparent font-semibold outline-none"/><label className="flex items-center gap-2 text-xs text-slate-400"><input aria-label="Durée en minutes" type="number" min="1" value={segment.duration} onChange={(e) => updateSegment(segment.id, 'duration', e.target.value)} className="w-14 rounded-lg border border-white/10 bg-[#0b1020] px-2 py-1 text-center text-white"/> min</label></div><textarea aria-label={`Texte : ${segment.title}`} value={segment.text} onChange={(e) => updateSegment(segment.id, 'text', e.target.value)} rows={3} className="w-full resize-y rounded-lg border border-white/5 bg-[#0b1020] p-3 text-sm leading-6 text-slate-200 outline-none focus:border-cyan-400/50"/></article>)}</div>}
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><h2 className="font-semibold">Conducteurs récents</h2><p className="mt-1 text-xs text-slate-400">Sauvegardés dans ce navigateur</p>{saved.length === 0 ? <p className="mt-5 text-sm text-slate-500">Aucun conducteur enregistré.</p> : <ul className="mt-4 space-y-2">{saved.map((item) => <li key={item.id}><button onClick={() => loadRundown(item)} className="w-full rounded-xl border border-white/10 p-3 text-left hover:border-cyan-400/50"><span className="block truncate text-sm font-medium">{item.name}</span><span className="mt-1 block truncate text-xs text-slate-400">{item.topic || 'Sujet à compléter'} · {item.segments.length} séquences</span></button></li>)}</ul>}</section>
            <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06] p-5"><h2 className="font-semibold text-cyan-100">Première brique du studio</h2><p className="mt-2 text-sm leading-6 text-slate-300">Le conducteur se prépare et se lit directement dans le navigateur. Les brouillons restent sur cet appareil. La génération vocale IA et la sauvegarde partagée nécessiteront ensuite un fournisseur et un stockage configurés.</p></section>
          </aside>
        </div>
        <footer className="mt-8 text-center text-xs text-slate-500">RMV Studio IA · Radio Miréréni Village · Heure de Mayotte (EAT, UTC+3)</footer>
      </div>
    </main>
  );
}

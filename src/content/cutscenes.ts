import { JOURNEY, RAID } from './tutorial';

/** Who speaks a page; the narrator has no name on screen. */
export type Speaker = 'narrator' | 'master' | 'apprentice';

export interface CutscenePage {
  readonly speaker: Speaker;
  /** `{name}` stands for the apprentice's name. */
  readonly text: string;
}

export interface Cutscene {
  readonly id: string;
  /** Shown once play reaches this stage: a tutorial stage, the raid or the journey. */
  readonly beforeStage: string;
  readonly pages: readonly CutscenePage[];
}

/** Name of the master as shown above her lines. */
export const MASTER_NAME = 'Kalliope';

export const CUTSCENES: readonly Cutscene[] = [
  {
    id: 'intro',
    beforeStage: '1a',
    pages: [
      { speaker: 'narrator', text: 'Es gibt Orte, an denen Worte schwerer wiegen als Gold. Die Bibliothek der Meisterin Kalliope ist so ein Ort. Und du wischst dort Staub.' },
      { speaker: 'master', text: '{name}! Lass den Staubwedel liegen. Heute lernst du schreiben.' },
      { speaker: 'apprentice', text: 'Ich kann schreiben. Ich schreibe seit Jahren Einkaufslisten.' },
      { speaker: 'master', text: 'Mit zehn Fingern, ohne hinzusehen. Richtig geschriebene Worte haben Macht. Falsch geschriebene haben Folgen.' },
      { speaker: 'apprentice', text: 'Was für Folgen?' },
      { speaker: 'master', text: 'Papiergolems. Ich habe ein paar gefaltet. Sie wollen in den Lesesaal. Halte sie auf.' },
      { speaker: 'master', text: 'Leg die Finger auf die Grundreihe: links A S D F, rechts J K L. Die Zeigefinger ertasten die kleinen Erhebungen auf F und J.' },
      { speaker: 'apprentice', text: 'Und wenn die Golems durchkommen?' },
      { speaker: 'master', text: 'Dann sortierst du heute Nacht Fußnoten.' },
    ],
  },
  {
    id: 'top-row',
    beforeStage: '2a',
    pages: [
      { speaker: 'master', text: 'Die Grundreihe sitzt. Zeit, nach oben zu greifen.' },
      { speaker: 'apprentice', text: 'Die obere Reihe. Wo die schwierigen Buchstaben wohnen.' },
      { speaker: 'master', text: 'Wo das E wohnt, {name}. Das häufigste Zeichen unserer Sprache. Ohne E kein Feuer, keine Feder, keine Ehre.' },
      { speaker: 'apprentice', text: 'Und kein Ende des Unterrichts.' },
      { speaker: 'master', text: 'Die Finger kehren immer zur Grundreihe zurück. Wie Schafe in den Stall.' },
    ],
  },
  {
    id: 'bottom-row',
    beforeStage: '3a',
    pages: [
      { speaker: 'master', text: 'Bleibt die untere Reihe. Dann kennst du alle Buchstaben.' },
      { speaker: 'apprentice', text: 'Und dann? Ein Diplom? Ein Hut mit Feder?' },
      { speaker: 'master', text: 'Dann kannst du alles schreiben, was die Welt hat. Auch Namen. Namen sind das Wichtigste.' },
      { speaker: 'narrator', text: 'Irgendwo jenseits der Hügel wurde es an diesem Tag sehr still. In der Bibliothek bemerkte es niemand.' },
    ],
  },
  {
    id: 'raid-before',
    beforeStage: RAID,
    pages: [
      { speaker: 'narrator', text: 'Es war der Abend, an dem {name} das letzte Zeichen lernte. Draußen verstummten die Vögel. Dann die Glocken. Dann der Wind.' },
      { speaker: 'apprentice', text: 'Meisterin? Hört Ihr das?' },
      { speaker: 'master', text: 'Ich höre nichts. Genau das ist das Problem.' },
      { speaker: 'master', text: 'An die Bauplätze, {name}. Das sind keine Papiergolems.' },
    ],
  },
  {
    id: 'raid-after',
    beforeStage: JOURNEY,
    pages: [
      { speaker: 'narrator', text: 'Die Bibliothek brannte bis zum Morgen. Bücher, die dreihundert Jahre überdauert hatten, wurden in einer Nacht zu Asche.' },
      { speaker: 'narrator', text: 'Kalliope stand im Lesesaal, als die Schatten kamen. Ihr letztes Wort hallte noch, als sie schon fort war – ein Bann, der über das Land rollte wie eine Flut.' },
      { speaker: 'apprentice', text: 'Ebbe und Flut. Sie hat ihnen Gezeiten gegeben. Bei Flut müssen sie weichen.' },
      { speaker: 'apprentice', text: 'Gut. Dann hole ich sie zurück. Staub zum Wischen gibt es hier ohnehin keinen mehr.' },
    ],
  },
  {
    id: 'ash-fields',
    beforeStage: JOURNEY,
    pages: [
      { speaker: 'narrator', text: 'Rund um die Bibliothek liegt das Land grau unter Ruß. Die Leute nennen es schon die Aschefelder.' },
      { speaker: 'narrator', text: 'In den Ruinen sitzt noch das Verstummen: Skorpione und Käfer aus Tinte, mit leeren Augen.' },
      { speaker: 'apprentice', text: 'Merkwürdig. Auf ihren Panzern sind Striche. Fein gezogen, in einem Zug. Wie mit dem Pinsel.' },
      { speaker: 'apprentice', text: 'Wer malt Ungeheuer? Und wer gibt sich dabei so viel Mühe?' },
      { speaker: 'narrator', text: 'Auf der Karte: Tippe das Wort über einem Ort und drücke Enter. Jeder befreite Ort öffnet die Wege zu seinen Nachbarn.' },
    ],
  },
];

export function cutscene(id: string): Cutscene {
  const scene = CUTSCENES.find((candidate) => candidate.id === id);
  if (!scene) throw new Error(`unknown cutscene ${id}`);
  return scene;
}

/** The cutscene to show before stage `stageId` starts, unless it was seen already. */
export function cutsceneBefore(stageId: string, seen: ReadonlySet<string>): Cutscene | null {
  return CUTSCENES.find((scene) => scene.beforeStage === stageId && !seen.has(scene.id)) ?? null;
}

/** The page text with the apprentice's name filled in. */
export function pageText(page: CutscenePage, name: string): string {
  return page.text.replaceAll('{name}', name);
}

/** The name shown above a page, or null for the narrator. */
export function speakerName(speaker: Speaker, name: string): string | null {
  return { narrator: null, master: MASTER_NAME, apprentice: name }[speaker];
}

/** What the master says after a practice battle; `{name}` stands for the apprentice's name. */
export const MASTER_VERDICTS: Readonly<Record<'won' | 'lost', readonly string[]>> = {
  won: [
    'Gut gemacht, {name}. Noch einmal – diesmal ohne zu zittern.',
    'Nicht schlecht. Die Golems sind beleidigt. Ich falte neue.',
    'Sauber getippt. Fast schon elegant. Weiter.',
    'Das war ordentlich. Ordentlich ist der Anfang von gut.',
  ],
  lost: [
    'Die Golems sind durch. Ich falte sie neu, du tippst neu.',
    'Fußnoten warten auf dich, {name}. Oder du versuchst es noch einmal.',
    'Langsam und genau schlägt schnell und falsch. Noch einmal.',
    'Kopf hoch. Papier verzeiht. Ich nicht – aber Papier schon.',
  ],
};

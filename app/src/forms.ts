/** Düzensiz fiiller (yalın → geçmiş, üçüncü hal) ve düzensiz çoğullar; çekim oyunu, kelime detayı ve boşluk doldurma için */

const VERBS = `arise arose arisen
awake awoke awoken
be was/were been
bear bore born
beat beat beaten
become became become
begin began begun
bend bent bent
bet bet bet
bind bound bound
bite bit bitten
bleed bled bled
blow blew blown
break broke broken
breed bred bred
bring brought brought
broadcast broadcast broadcast
build built built
burn burnt/burned burnt/burned
burst burst burst
buy bought bought
cast cast cast
catch caught caught
choose chose chosen
cling clung clung
come came come
cost cost cost
creep crept crept
cut cut cut
deal dealt dealt
dig dug dug
dive dived/dove dived
do did done
draw drew drawn
dream dreamt/dreamed dreamt/dreamed
drink drank drunk
drive drove driven
eat ate eaten
fall fell fallen
feed fed fed
feel felt felt
fight fought fought
find found found
flee fled fled
fling flung flung
fly flew flown
forbid forbade forbidden
forecast forecast forecast
forget forgot forgotten
forgive forgave forgiven
freeze froze frozen
get got got/gotten
give gave given
go went gone
grind ground ground
grow grew grown
hang hung hung
have had had
hear heard heard
hide hid hidden
hit hit hit
hold held held
hurt hurt hurt
keep kept kept
kneel knelt knelt
know knew known
lay laid laid
lead led led
lean leant/leaned leant/leaned
leap leapt/leaped leapt/leaped
learn learnt/learned learnt/learned
leave left left
lend lent lent
let let let
lie lay lain
light lit lit
lose lost lost
make made made
mean meant meant
meet met met
mislead misled misled
mistake mistook mistaken
overcome overcame overcome
oversee oversaw overseen
overtake overtook overtaken
pay paid paid
prove proved proven/proved
put put put
quit quit quit
read read read
rid rid rid
ride rode ridden
ring rang rung
rise rose risen
run ran run
saw sawed sawn
say said said
see saw seen
seek sought sought
sell sold sold
send sent sent
set set set
sew sewed sewn
shake shook shaken
shed shed shed
shine shone shone
shoot shot shot
show showed shown
shrink shrank shrunk
shut shut shut
sing sang sung
sink sank sunk
sit sat sat
sleep slept slept
slide slid slid
smell smelt/smelled smelt/smelled
speak spoke spoken
speed sped sped
spell spelt/spelled spelt/spelled
spend spent spent
spill spilt/spilled spilt/spilled
spin spun spun
spit spat spat
split split split
spoil spoilt/spoiled spoilt/spoiled
spread spread spread
spring sprang sprung
stand stood stood
steal stole stolen
stick stuck stuck
sting stung stung
stink stank stunk
strike struck struck
string strung strung
strive strove striven
swear swore sworn
sweep swept swept
swell swelled swollen
swim swam swum
swing swung swung
take took taken
teach taught taught
tear tore torn
tell told told
think thought thought
throw threw thrown
thrust thrust thrust
tread trod trodden
undergo underwent undergone
understand understood understood
undertake undertook undertaken
upset upset upset
wake woke woken
wear wore worn
weave wove woven
weep wept wept
win won won
wind wound wound
withdraw withdrew withdrawn
withstand withstood withstood
wring wrung wrung
write wrote written`

const PLURALS = `analysis analyses
basis bases
child children
crisis crises
criterion criteria
diagnosis diagnoses
foot feet
goose geese
half halves
hypothesis hypotheses
knife knives
leaf leaves
life lives
loaf loaves
man men
medium media
mouse mice
person people
phenomenon phenomena
potato potatoes
sheep sheep
shelf shelves
thesis theses
thief thieves
tomato tomatoes
tooth teeth
wife wives
wolf wolves
woman women
hero heroes
fish fish
deer deer
species species
series series
aircraft aircraft
ox oxen`

export const IRREGULAR_VERBS: Record<string, { past: string; participle: string }> = Object.fromEntries(
  VERBS.split('\n').map((l) => {
    const [base, past, participle] = l.trim().split(' ')
    return [base, { past, participle }]
  }),
)

export const IRREGULAR_PLURALS: Record<string, string> = Object.fromEntries(PLURALS.split('\n').map((l) => l.trim().split(' ') as [string, string]))

/** Kartın yalın hali: "lie (1)" gibi numaralar ve "sb/sth" dışarıda */
export function baseWord(word: string): string {
  return word.toLowerCase().replace(/\s*\(.*\)$/, '').trim()
}

export function verbForms(word: string) {
  return IRREGULAR_VERBS[baseWord(word)]
}

export function pluralOf(word: string) {
  return IRREGULAR_PLURALS[baseWord(word)]
}

/** Düzenli -ed hali (yaklaşık; sadece çeldirici ve metinde arama için) */
export function regularPast(w: string): string {
  if (w.endsWith('e')) return `${w}d`
  if (/[^aeiou]y$/.test(w)) return `${w.slice(0, -1)}ied`
  return `${w}ed`
}

/** Bir kelimenin metinde görülebilecek halleri: çekimler, çoğul, -s/-ed/-ing ekleri */
export function wordVariants(word: string): string[] {
  const w = baseWord(word)
  const out = new Set([w, `${w}s`, `${w}es`, regularPast(w), `${w}ing`, `${w}er`, `${w}ly`])
  if (w.endsWith('e')) out.add(`${w.slice(0, -1)}ing`)
  if (/[^aeiou]y$/.test(w)) out.add(`${w.slice(0, -1)}ies`)
  // Tek heceli ünsüz-ünlü-ünsüz: stop -> stopped, stopping
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(w)) {
    out.add(`${w}${w.at(-1)}ed`)
    out.add(`${w}${w.at(-1)}ing`)
  }
  const v = IRREGULAR_VERBS[w]
  if (v) for (const f of [...v.past.split('/'), ...v.participle.split('/')]) out.add(f)
  if (w === 'be') ['am', 'is', 'are'].forEach((f) => out.add(f))
  const p = IRREGULAR_PLURALS[w]
  if (p) out.add(p)
  return [...out]
}

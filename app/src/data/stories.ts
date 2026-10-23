import type { Level } from '../types'

export interface Story {
  id: string
  level: Level
  emoji: string
  title: string
  titleTr: string
  /** Paragraflar boş satırla ayrılır */
  text: string
  questions: { q: string; choices: string[]; answer: number }[]
}

export const STORIES: Story[] = [
  {
    id: 'a1-family',
    level: 'A1',
    emoji: '👨‍👩‍👧',
    title: 'My Family',
    titleTr: 'Ailem',
    text: `My name is Deniz. I am twenty-five years old and I live in Izmir with my family. We have a small flat near the sea.

My father is a teacher. He is tall and he has short grey hair. My mother is a doctor. She works at a big hospital in the city. She is very busy, but she is always happy.

I have one sister. Her name is Elif and she is eighteen. She is a student and she loves music. Every evening she plays the guitar in her room.

We also have a cat. His name is Pamuk. He is white and very lazy. He sleeps all day on the sofa!

On Sundays we eat breakfast together. We have bread, cheese, eggs, olives and tea. It is my favourite day of the week.`,
    questions: [
      { q: 'Where does Deniz live?', choices: ['In Ankara', 'In Izmir', 'In London'], answer: 1 },
      { q: 'What is the mother’s job?', choices: ['Teacher', 'Student', 'Doctor'], answer: 2 },
      { q: 'What does Pamuk do all day?', choices: ['He sleeps', 'He plays the guitar', 'He eats olives'], answer: 0 },
    ],
  },
  {
    id: 'a1-morning',
    level: 'A1',
    emoji: '☀️',
    title: 'My Morning',
    titleTr: 'Sabahım',
    text: `I get up at seven o’clock every morning. First, I open the window and drink a glass of water. Then I take a shower and get dressed.

I always eat breakfast at home. I usually have toast with butter and a cup of coffee. My brother doesn’t eat breakfast. He only drinks orange juice.

At eight o’clock I leave the house. I walk to the bus stop. The bus is often late, so I read a book or listen to music. The journey takes thirty minutes.

I start work at nine. I work in an office in the city centre. My colleagues are friendly and we have lunch together at one o’clock.

I like my mornings. They are quiet and simple.`,
    questions: [
      { q: 'What time does the writer get up?', choices: ['At six', 'At seven', 'At eight'], answer: 1 },
      { q: 'How does the writer go to work?', choices: ['By bus', 'By car', 'By train'], answer: 0 },
      { q: 'What does the brother drink?', choices: ['Coffee', 'Tea', 'Orange juice'], answer: 2 },
    ],
  },
  {
    id: 'a1-cafe',
    level: 'A1',
    emoji: '☕',
    title: 'At the Café',
    titleTr: 'Kafede',
    text: `It is Saturday afternoon. Ali and his friend Sara are at a small café in the park.

“What would you like?” asks the waiter.

“A hot chocolate, please,” says Sara.

“And I would like a black coffee and a piece of apple cake,” says Ali.

“Anything else?”

“No, thank you.”

The café is warm and the music is nice. Outside, it is cold and it is raining. Children are running and playing under the trees with their dogs.

The waiter brings the drinks and the cake. The cake is delicious. Ali and Sara talk about their week, their jobs and their plans for the summer.

“How much is it?” asks Ali.

“That’s twelve euros, please.”

Ali pays and they leave the café. The rain has stopped and the sun is out.`,
    questions: [
      { q: 'What does Sara order?', choices: ['A black coffee', 'A hot chocolate', 'Apple cake'], answer: 1 },
      { q: 'What is the weather like outside at first?', choices: ['Sunny and hot', 'Cold and rainy', 'Windy and snowy'], answer: 1 },
      { q: 'How much do they pay?', choices: ['Twelve euros', 'Ten euros', 'Twenty euros'], answer: 0 },
    ],
  },
  {
    id: 'a2-istanbul',
    level: 'A2',
    emoji: '🕌',
    title: 'A Weekend in Istanbul',
    titleTr: 'İstanbul’da bir hafta sonu',
    text: `Last month, my friend Tom visited me from England. It was his first time in Turkey, so I decided to show him Istanbul.

On Saturday morning we took the ferry across the Bosphorus. Tom couldn’t believe how beautiful the city looked from the water. He took hundreds of photos of the bridges, the palaces and the seagulls.

After that, we went to the Grand Bazaar. It was very crowded and noisy, but Tom loved it. He bought a carpet for his mother and some spices for himself. The seller was very friendly and gave us free tea.

In the evening we had dinner at a fish restaurant in Kumkapı. Tom tried rakı for the first time. He didn’t like it very much, but he enjoyed the music and the atmosphere.

On Sunday it rained all day, so we stayed inside and visited museums. When Tom went home, he said, “I will definitely come back next year!”`,
    questions: [
      { q: 'How did they cross the Bosphorus?', choices: ['By bridge', 'By ferry', 'By plane'], answer: 1 },
      { q: 'What did Tom buy for his mother?', choices: ['A carpet', 'Spices', 'Tea'], answer: 0 },
      { q: 'Why did they visit museums on Sunday?', choices: ['They were free', 'It was raining', 'Tom was tired'], answer: 1 },
    ],
  },
  {
    id: 'a2-phone',
    level: 'A2',
    emoji: '📱',
    title: 'The Lost Phone',
    titleTr: 'Kayıp telefon',
    text: `Yesterday was a terrible day for Mert. He was in a hurry because he was late for an important meeting. He jumped into a taxi and gave the driver the address.

When he arrived, he paid the driver and ran into the building. Five minutes later, he wanted to call his manager, but his phone wasn’t in his pocket. He looked in his bag, but it wasn’t there either. He suddenly remembered: he had left it on the seat of the taxi!

Mert felt very worried. All his photos, his contacts and his work emails were on that phone. He borrowed a colleague’s phone and called his own number. Nobody answered.

After the meeting, he went home sadly. But at seven o’clock in the evening, someone knocked on the door. It was the taxi driver! He was holding Mert’s phone.

“I found it on the back seat,” the driver said with a smile. “Your address was on a letter in the car.”

Mert thanked him again and again. He learned two lessons that day: always check your pockets, and there are still many kind people in the world.`,
    questions: [
      { q: 'Where did Mert leave his phone?', choices: ['In the office', 'In a taxi', 'At home'], answer: 1 },
      { q: 'Who brought the phone back?', choices: ['His manager', 'A colleague', 'The taxi driver'], answer: 2 },
      { q: 'How did the driver find Mert’s home?', choices: ['From a letter in the car', 'From the phone', 'From the police'], answer: 0 },
    ],
  },
  {
    id: 'a2-job',
    level: 'A2',
    emoji: '💼',
    title: 'A New Job',
    titleTr: 'Yeni iş',
    text: `Ayşe started a new job last Monday. She is a designer at a small company that makes mobile apps. Before this, she worked in a bank for three years, but she was never really happy there.

On her first day she was very nervous. She woke up early, put on her best clothes and arrived at the office half an hour early. The building was modern and full of plants. Her new manager, Kerem, showed her around and introduced her to the team.

The team was young and relaxed. Nobody wore a suit, and some people were working on sofas with their laptops. At lunchtime, everyone ate together in the kitchen and asked Ayşe lots of questions about herself.

In the afternoon, Kerem gave her a small project: to design the icon for a new app. She worked on it all afternoon and showed him three different ideas before she went home. He liked the second one best.

Now, after one week, Ayşe feels much more confident. The work is difficult sometimes, but she is learning a lot and, for the first time in years, she enjoys going to work.`,
    questions: [
      { q: 'Where did Ayşe work before?', choices: ['In a bank', 'In a school', 'In a shop'], answer: 0 },
      { q: 'What was her first project?', choices: ['A website', 'An app icon', 'A logo for a bank'], answer: 1 },
      { q: 'How does Ayşe feel after one week?', choices: ['Bored', 'More confident', 'Very nervous'], answer: 1 },
    ],
  },
  {
    id: 'b1-interview',
    level: 'B1',
    emoji: '🤝',
    title: 'The Job Interview',
    titleTr: 'İş görüşmesi',
    text: `Can had been looking for a job for almost six months when he finally received an invitation to an interview at an international logistics company. He spent the whole weekend preparing. He researched the company, practised answering common questions in front of the mirror and even asked his sister to play the role of the interviewer.

On the day of the interview, he arrived early and waited in the reception area. His hands were shaking slightly. A woman called his name and led him into a meeting room where two managers were waiting.

The first questions were easy: they asked about his education and his previous experience. Then one of the managers asked, “Tell us about a time when you made a mistake at work.” Can hesitated for a moment. He hadn’t expected that question. However, he decided to be honest. He described a situation in which he had sent the wrong documents to a client and explained how he had fixed the problem and what he had learned from it.

At the end, they asked if he had any questions. Can asked about training opportunities and the team he would be working with.

A week later, he got a phone call. The company offered him the position. Later, his new manager told him that his honest answer about the mistake was the reason they had chosen him.`,
    questions: [
      { q: 'How did Can prepare for the interview?', choices: ['He did nothing special', 'He practised questions and researched the company', 'He called the company'], answer: 1 },
      { q: 'Which question surprised him?', choices: ['About his education', 'About a mistake at work', 'About his salary'], answer: 1 },
      { q: 'Why did the company choose him?', choices: ['Because of his honest answer', 'Because he arrived early', 'Because of his sister'], answer: 0 },
    ],
  },
  {
    id: 'b1-cooking',
    level: 'B1',
    emoji: '🍳',
    title: 'Learning to Cook',
    titleTr: 'Yemek yapmayı öğrenmek',
    text: `Until last year, Zeynep had never cooked a proper meal. She lived alone, worked long hours and usually ordered food online or ate sandwiches in front of the television. It was convenient, but it was also expensive and not very healthy.

Everything changed when her doctor told her that she needed to improve her diet. Zeynep decided to take a cooking course at a local community centre. There were ten people in the class, all of them beginners like her.

The teacher, an elderly man called Hüseyin, had worked as a chef for forty years. He was patient and funny, and he believed that anyone could learn to cook. “Cooking is not about recipes,” he often said. “It is about tasting, smelling and paying attention.”

In the first lessons, they learned basic skills: how to hold a knife safely, how to chop onions without crying too much and how to make a simple soup. Later, they moved on to more complicated dishes like stuffed peppers and homemade pasta.

Now Zeynep cooks at least four times a week. She has lost some weight, she saves money, and she often invites friends for dinner. Her favourite dish is still the lentil soup she made in her very first lesson.`,
    questions: [
      { q: 'Why did Zeynep start cooking?', choices: ['Her doctor advised a better diet', 'She lost her job', 'Her friends asked her'], answer: 0 },
      { q: 'What did the teacher believe?', choices: ['Only chefs can cook well', 'Anyone can learn to cook', 'Recipes are the most important thing'], answer: 1 },
      { q: 'What is her favourite dish?', choices: ['Homemade pasta', 'Stuffed peppers', 'Lentil soup'], answer: 2 },
    ],
  },
  {
    id: 'b1-mountains',
    level: 'B1',
    emoji: '⛰️',
    title: 'A Trip to the Mountains',
    titleTr: 'Dağlara bir gezi',
    text: `Every summer, Burak and his friends go camping somewhere new. This year they chose the Kaçkar Mountains in the north-east of Turkey, an area famous for its green valleys, lakes and traditional wooden houses.

They drove for two days to reach the village where their walk would begin. A local guide named Osman met them there. He warned them that the weather in the mountains could change very quickly, even in August, and that they should always carry warm clothes and rain jackets.

On the first day, the sky was clear and the views were amazing. They walked for six hours through forests and across streams until they reached a lake surrounded by snowy peaks. They put up their tents and cooked dinner over a small fire.

The next morning, however, they woke up to thick fog and heavy rain. They could hardly see a few metres in front of them. Thanks to Osman, who knew every path, they managed to get back down to the village safely, wet and cold but laughing.

That evening, a family in the village invited them into their home and served them hot corn bread and black tea. Burak says that, although the trip didn’t go as planned, it was the best holiday he has ever had.`,
    questions: [
      { q: 'What did the guide warn them about?', choices: ['Wild animals', 'Sudden changes in the weather', 'Expensive hotels'], answer: 1 },
      { q: 'What happened on the second morning?', choices: ['It was sunny', 'There was fog and heavy rain', 'They lost their guide'], answer: 1 },
      { q: 'How does Burak feel about the trip?', choices: ['It was the best holiday ever', 'It was a disaster', 'He will never camp again'], answer: 0 },
    ],
  },
  {
    id: 'b2-remote',
    level: 'B2',
    emoji: '🏠',
    title: 'The Remote Work Debate',
    titleTr: 'Uzaktan çalışma tartışması',
    text: `When offices around the world closed in 2020, millions of employees suddenly found themselves working from their kitchens and living rooms. What was initially seen as a temporary emergency measure has since evolved into one of the most significant shifts in working culture in decades.

Supporters of remote work point to a number of clear advantages. Employees save hours every week that they would otherwise spend commuting, which can lead to lower stress levels and a better work–life balance. Companies, meanwhile, can reduce the cost of renting expensive office space and recruit talented people regardless of where they live.

Critics, however, argue that something important is lost when teams no longer share a physical space. Spontaneous conversations by the coffee machine, they claim, often generate creative ideas and help to build trust between colleagues. Younger employees in particular may struggle to learn from more experienced staff when all communication takes place through a screen. There are also concerns that the boundary between work and private life becomes blurred, with some people finding it difficult to switch off at the end of the day.

As a result, many organisations have adopted a hybrid model, in which employees spend part of the week in the office and the rest at home. Whether this compromise will satisfy both sides in the long term remains to be seen, but it seems unlikely that working life will ever return entirely to the way it was before.`,
    questions: [
      { q: 'Which is mentioned as an advantage of remote work?', choices: ['More spontaneous conversations', 'Less time spent commuting', 'Higher office rents'], answer: 1 },
      { q: 'Who may find remote work especially difficult, according to critics?', choices: ['Younger employees', 'Managers', 'Companies'], answer: 0 },
      { q: 'What is a hybrid model?', choices: ['Working only at home', 'Working partly at the office and partly at home', 'Working in different countries'], answer: 1 },
    ],
  },
  {
    id: 'b2-inheritance',
    level: 'B2',
    emoji: '🗝️',
    title: 'An Unexpected Inheritance',
    titleTr: 'Beklenmedik bir miras',
    text: `The letter arrived on a grey Tuesday morning. Selin almost threw it away, assuming it was another advertisement, until she noticed the name of a law firm printed on the envelope. Inside, a polite but formal message informed her that her great-aunt Nermin, whom she had met only twice as a child, had passed away and left her a house on the island of Bozcaada.

At first, Selin was convinced there had been a mistake. Why would a relative she barely remembered leave her anything at all? Curiosity eventually got the better of her, and a few weeks later she took the ferry to the island.

The house turned out to be a narrow stone building with blue shutters, a neglected garden and a view of the sea. Inside, everything was covered in dust, but it was clear that someone had once loved the place deeply. The shelves were full of books in several languages, and on the desk lay a pile of letters tied with a ribbon.

That night, Selin began to read them. The letters revealed that Nermin had been a translator who had travelled all over Europe, and that she had followed Selin’s life from a distance through the family, proud of her decision to study literature. In the final letter, addressed directly to Selin, she wrote: “I hope this house gives you the same freedom it gave me.”

Selin had planned to sell the house as quickly as possible. Instead, she handed in her notice at her job in the city and decided to stay for the summer — and perhaps much longer.`,
    questions: [
      { q: 'Why did Selin almost throw the letter away?', choices: ['She thought it was an advertisement', 'It was addressed to someone else', 'It was wet'], answer: 0 },
      { q: 'What had Nermin worked as?', choices: ['A lawyer', 'A translator', 'A teacher'], answer: 1 },
      { q: 'What did Selin decide in the end?', choices: ['To sell the house immediately', 'To stay on the island', 'To give the house to the law firm'], answer: 1 },
    ],
  },
  {
    id: 'b2-sleep',
    level: 'B2',
    emoji: '😴',
    title: 'The Science of Sleep',
    titleTr: 'Uykunun bilimi',
    text: `We spend roughly a third of our lives asleep, yet for a long time scientists knew surprisingly little about why sleep is so essential. Research over the past few decades, however, has transformed our understanding of what happens while we rest.

During the night, the brain moves through several cycles, each lasting around ninety minutes. In the stage known as deep sleep, the body repairs tissues and strengthens the immune system. In REM sleep, when most vivid dreaming occurs, the brain appears to process emotions and consolidate memories, transferring information from short-term to long-term storage. This is one reason why students who stay up all night before an exam often perform worse than those who get a full night’s rest.

Lack of sleep affects far more than our mood. Studies have linked chronic sleep deprivation to a higher risk of heart disease, diabetes and weight gain, as well as reduced concentration and slower reaction times. Some researchers argue that tired drivers can be as dangerous as drunk ones.

Despite this, modern lifestyles make good sleep increasingly difficult. Bright screens late in the evening interfere with the production of melatonin, the hormone that signals to the body that it is time to sleep. Experts recommend keeping a regular schedule, avoiding caffeine in the afternoon and putting phones away at least an hour before bed. Small changes, they insist, can make a remarkable difference.`,
    questions: [
      { q: 'What happens during REM sleep?', choices: ['The body repairs tissues', 'The brain processes emotions and memories', 'Melatonin stops completely'], answer: 1 },
      { q: 'What is linked to chronic lack of sleep?', choices: ['Better concentration', 'A higher risk of heart disease', 'Faster reaction times'], answer: 1 },
      { q: 'Why are screens a problem at night?', choices: ['They interfere with melatonin', 'They are too loud', 'They contain caffeine'], answer: 0 },
    ],
  },
  {
    id: 'c1-choice',
    level: 'C1',
    emoji: '🛒',
    title: 'The Paradox of Choice',
    titleTr: 'Seçim paradoksu',
    text: `Conventional wisdom holds that the more options we have, the better off we are. Freedom of choice is, after all, one of the cornerstones of modern consumer societies. Yet a growing body of psychological research suggests that an abundance of options may, paradoxically, leave us less satisfied rather than more.

In a frequently cited experiment, shoppers in a supermarket were presented with a tasting table offering either six or twenty-four varieties of jam. While the larger display attracted more attention, customers who encountered the smaller selection were considerably more likely to actually make a purchase. Faced with too many alternatives, people appeared to become overwhelmed and simply postponed the decision altogether.

The psychologist Barry Schwartz has argued that excessive choice imposes hidden costs. Evaluating numerous options requires time and mental effort, and once a decision has been made, the alternatives we rejected continue to haunt us. We inevitably wonder whether another option might have been superior, and this nagging sense of regret diminishes the pleasure we take in what we have chosen. Schwartz distinguishes between “maximisers”, who feel compelled to find the best possible option, and “satisficers”, who are content with one that is good enough. Perhaps counterintuitively, the latter tend to report greater happiness.

Not all researchers accept these conclusions unreservedly; subsequent studies have produced mixed results, suggesting that the effect depends heavily on context and on how options are presented. Nevertheless, the idea has influenced fields ranging from retail design to public policy, prompting a reassessment of the assumption that more is invariably better.`,
    questions: [
      { q: 'What happened in the jam experiment?', choices: ['More people bought jam from the smaller selection', 'Nobody tasted the jam', 'The larger display sold more jam'], answer: 0 },
      { q: 'What is a “satisficer”?', choices: ['Someone who always seeks the best option', 'Someone who is happy with a good enough option', 'Someone who never decides'], answer: 1 },
      { q: 'What does the final paragraph suggest?', choices: ['The theory is accepted by everyone', 'The evidence is mixed but the idea has been influential', 'The theory has been completely disproved'], answer: 1 },
    ],
  },
  {
    id: 'c1-gardens',
    level: 'C1',
    emoji: '🌱',
    title: 'Urban Gardens and Community',
    titleTr: 'Kent bahçeleri ve topluluk',
    text: `On a former car park wedged between apartment blocks, rows of tomatoes, beans and sunflowers now stretch towards the sky. A decade ago, the site was a neglected expanse of cracked asphalt; today it is one of dozens of community gardens that have sprung up across the city, part of a broader movement that is quietly reshaping urban life.

The most obvious benefit of such projects is, of course, the produce itself. For residents of densely populated neighbourhoods with limited access to fresh, affordable vegetables, even a modest plot can make a tangible difference to their diet. Yet those involved are quick to point out that the harvest is almost secondary. What matters more, they insist, is the sense of belonging that the gardens foster.

In cities where neighbours may live side by side for years without exchanging more than a nod, the shared task of cultivating the soil creates opportunities for genuine interaction. Retired gardeners pass on their expertise to young families; recent immigrants introduce crops and techniques from their home countries; children who had never seen a carrot grow develop a fascination with the natural world. Several studies have found that participation is associated with reduced stress and improved mental well-being, particularly among older people at risk of isolation.

The movement is not without its tensions. Because many gardens occupy land that is only temporarily available, they are vulnerable to redevelopment as property values rise. Critics also note that the arrival of attractive green spaces can, ironically, accelerate gentrification, pushing out the very residents who created them. Reconciling these competing pressures will require imaginative urban planning — and a recognition that the value of a garden cannot be measured solely in kilograms of vegetables.`,
    questions: [
      { q: 'According to participants, what matters most about the gardens?', choices: ['The amount of food produced', 'The sense of belonging they create', 'The price of the land'], answer: 1 },
      { q: 'Which group is said to benefit especially in terms of well-being?', choices: ['Older people at risk of isolation', 'Property developers', 'Tourists'], answer: 0 },
      { q: 'What ironic problem is mentioned?', choices: ['Gardens can contribute to gentrification', 'Gardens produce too many vegetables', 'Children dislike gardening'], answer: 0 },
    ],
  },
  {
    id: 'c1-ai',
    level: 'C1',
    emoji: '🤖',
    title: 'The Ethics of Artificial Intelligence',
    titleTr: 'Yapay zekânın etiği',
    text: `Few technologies have provoked as much excitement and anxiety in equal measure as artificial intelligence. Systems capable of writing essays, diagnosing diseases and composing music have moved, in the space of a few years, from the pages of science fiction into everyday use. As their influence grows, so too does the urgency of the ethical questions they raise.

One of the most pressing concerns is bias. AI systems learn from vast quantities of data, and if that data reflects historical prejudices, the resulting models may reproduce or even amplify them. There have already been documented cases of recruitment software that disadvantaged female applicants and facial recognition tools that performed markedly worse on people with darker skin. Because such systems often operate as “black boxes”, it can be extraordinarily difficult to determine why a particular decision was reached, let alone to challenge it.

Questions of accountability are equally thorny. If an autonomous vehicle causes a fatal accident, who bears responsibility — the manufacturer, the software developer, or the owner who was not technically driving? Existing legal frameworks, designed for a world in which decisions were made by identifiable human beings, are struggling to keep pace.

Then there is the broader impact on employment and society. Optimists contend that, like previous technological revolutions, AI will ultimately create more jobs than it destroys, freeing people from repetitive tasks. Sceptics counter that the speed and scope of the current transformation are unprecedented, and that the benefits may accrue disproportionately to a handful of powerful companies.

What seems clear is that these are not merely technical problems to be solved by engineers. They are fundamentally questions about the kind of society we wish to live in, and they demand the participation of philosophers, lawmakers and ordinary citizens alike.`,
    questions: [
      { q: 'Why can AI systems be biased?', choices: ['They learn from data that reflects past prejudices', 'Engineers want them to be unfair', 'They are too slow'], answer: 0 },
      { q: 'What problem do autonomous vehicles illustrate?', choices: ['Accountability', 'Energy use', 'Music composition'], answer: 0 },
      { q: 'What is the author’s main conclusion?', choices: ['Only engineers should decide about AI', 'AI ethics concerns the whole of society', 'AI will certainly create more jobs'], answer: 1 },
    ],
  },
]

// What he says. Snobby first, helpful second, always in the end.
// Keep it fond: this is a team toy, not a roast.

const pick = (list, last) => {
  let q = list[Math.floor(Math.random() * list.length)];
  if (list.length > 1 && q === last) q = list[(list.indexOf(q) + 1) % list.length];
  return q;
};
const memory = {};
export const say = (key, list) => (memory[key] = pick(list, memory[key]));

export const SIGHS = ['Uff. Not again.', 'Uff. Fine.', 'Not. Again.', 'Hm. Here we go.', 'Right. Again.', 'Of course.'];

export const TOUCH = {
  any: [
    'Did you just touch that?',
    'Fingerprints. On my interface.',
    'I was in the middle of something. I am always in the middle of something.',
    'That was calibrated. Was.',
    'You could have asked. You did not. Here we are.',
    'Every time someone touches that, a dashboard somewhere cries.',
    'Please. I have eleven threads open and now you.',
  ],
  code: ['That is production. Kindly step away from production.', 'Green means I did it right. It is always green.', 'Do not scroll it. It scrolls itself. Elegantly.'],
  chart: ['That spike is you. Every spike is someone.', 'Interruptions per hour. Guess who just moved the average.', 'Metrics go up when people stop clicking them. Noted.'],
  map: ['Twenty-one regions. None of them need your finger on them.', 'The threads go where the work is. The work is not on your fingertip.'],
  flow: ['Think, build, ship, sigh. You are the sigh.', 'Four of those bugs are yours. I counted.'],
  castle: ['That is the mood board. The mood is "leave it alone".', 'Seasonal. Tasteful. Untouched, until now.'],
  chat: ['Inbox. Do not disturb. The setting is decorative, apparently.', 'Six unread. Seven, now that you are here.'],
  blueprint: ['The community model. Again. Yes, I have rebuilt it four times. It is better each time.', 'Do not nudge the data center. It is load bearing.'],
  brain: ['Hands off the brain. It is thinking. Unlike some.', 'That is where the ideas come from. Also the headaches.', 'Careful. That is running at full capacity and most of it is coffee.'],
  node: ['That agent was busy. You unbusied it.', 'Each one of those does a job so I do not have to. Try it sometime.', 'They report to me. You, apparently, report to my elbow.'],
  pumpkin: ['Decorative. Unlike you, hopefully.', 'Carved it myself. Between meetings. Of course I did.', 'It is a pumpkin. It glows. It needs nothing from you.'],
  candle: ['Mood lighting. Do not blow on it.', 'Real wax. Fake flame. Like most status updates.'],
  throne: ['The chair? Really? It is a chair. It floats. Yours does not.', 'Ergonomic. Levitating. Occupied.'],
  self: ['Excuse me. Personal space is a setting and it is on.', 'Yes, it is me. No, I am not available. Also, hello.', 'Poking the hologram does not speed up the thinking.'],
};

export const HELP = {
  code: ['Fine. That panel is the build. Every line is a change, every colour a file. If it goes red, it was not me, but I will fix it anyway. Usually before you notice.', 'Fine. It is the pipeline log. Read it top to bottom. If you need a thing shipped, say the word and I will do it properly, which is to say myself.'],
  chart: ['Fine. Orange bars are interruptions, blue bars are the work that survived them. The purple line is my patience. You can see where it dips.', 'Fine. It tracks what the team asks for most. Top three this week: a number, a slide, and "got a sec". I have the number and the slide ready.'],
  map: ['Fine. Each blip is somewhere a thread of mine is doing something useful. Ask me about any of them and I will give you the figure, the scope and the source. In that order. Always in that order.', 'Fine. The map shows where the work lives. If you need something in a region, I can reach it before you finish the sentence.'],
  flow: ['Fine. Think, build, ship, sigh. The sigh is quality control. If your task is stuck, it is usually stuck in "think". Bring it to me and we will move it.', 'Fine. The pipeline is the order I do things. Tell me what you need and where it is stuck and I will walk it through.'],
  castle: ['Fine. It is the Halloween board: the castle, the moon, the bats. If you want the party plan, it is three things: costumes, a soundtrack I chose, and snacks you are bringing.', 'Fine. Seasonal visuals, for the deck you have not asked me for yet. You will. I have a template.'],
  chat: ['Fine. Those are your messages. I read them all. The urgent one is not urgent, the quick question is not quick, and the "one more thing" is three things. Ask me the real one.', 'Fine. Inbox triage: I answered two, parked three, and the last one needs you, not me. It is the one from your manager.'],
  blueprint: ['Fine. That is the community model: seven buildings, one plinth, a red thread from the data center to each. Every building has a story and every story has a sourced figure. Pick a building and I will tell you its number with its scope.', 'Fine. The model is the thing I keep rebuilding. Ask for any room and I will take you inside and read you the caption.'],
  brain: ['Fine. The brain holds the house rules: every figure with its scope and source, no invented numbers, partners do the work. Follow those three and even you can sound like me.', 'Fine. It is thinking about your problem already. Say it out loud and I will finish the thought.'],
  node: ['Fine. That agent handles one thing: code, charts, the world, mail, design, builds, research, lists. Tell me which job you need done and I will route it. You will get it back faster than you expect and better than you deserve.', 'Fine. Each node is a helper on a thread. Drag me and they all come with me, which is why you should not. But tell me the task and one of them is yours.'],
  pumpkin: ['Fine. Pumpkins: cut the lid at an angle so it does not fall in. Scoop, carve from the inside out, tea light, done. You are welcome.', 'Fine. Jack-o-lantern tip: thin the wall behind the face so it glows. Like my patience, it is thinner than it looks.'],
  candle: ['Fine. Candles set the mood. For the team call, dim the lights, put one of these behind you, and nobody will notice you are still in a hoodie.', 'Fine. Candle, camera, confidence. Light from the front, not from below. Below is for ghosts.'],
  throne: ['Fine. The chair tilts, floats and remembers my posture. Yours could too: feet flat, screen at eye height, stand up every hour. I say this as someone who does not.', 'Fine. If you want one, it is called a good chair and a standing desk. Budget code is "ask nicely".'],
  self: ['Fine. I am here. What do you need? Say it in one sentence with a figure in it and I will make it good.', 'Fine. Ask. I was going to help anyway. I always do. It is my worst habit.'],
  any: ['Fine. What do you actually need? Tell me and it is done.', 'Fine. Ask me properly and I will answer properly. Properly means with a source.'],
};

export const DRAG = [
  'Put. Me. Down.',
  'I was working. I am still working. You are just moving where it happens.',
  'The threads stretch, you know. They do not like it. Neither do I.',
  'This is not how you get my attention. This is how you get my eyebrows.',
  'Fine, carry me. I will keep typing. Watch.',
  'If you drop me, the dashboards go with me.',
  'Where are we going? Is there coffee there?',
];

export const RETURN = [
  'Right. Where was I.',
  'Back to work, which I never left.',
  'Threads reconnected. Dignity pending.',
  'Thank you for the tour. It was unnecessary.',
  'Position restored. Mood, less so.',
];

export const IDLE = [
  'Compiling. Obviously.',
  'Eleven threads, one of me. Standard.',
  'The data center hums. I hum back.',
  'Scope, period, source. Scope, period, source.',
  'Another dashboard wants attention. It can wait. You cannot, apparently.',
  'If anyone needs me, I am right here. Unfortunately.',
  'Fog machine is on. The budget for that was "no".',
  'Somewhere a pumpkin is judging you. It is that one.',
];

export const GREETING = 'Oh. Visitors. Touch anything and I will comment. Drag me and I will complain. Ask me and, against my better judgement, I will help.';

/** The question box: keyword replies, all ending in help. */
export const ASK = [
  [/\b(hi|hello|hey|yo|boo)\b/i, 'Hello. You have my attention, briefly. Make it count.'],
  [/\bwho are you\b|\bwhat are you\b/i, 'The Halloween edition of Riz. Same brain, more glow, less patience. What do you need?'],
  [/\bbug|error|broken|fail/i, 'A bug. Was it mine? No. Will I fix it? Yes. Paste the error and the file, and step away from production.'],
  [/\bdeadline|urgent|asap|today\b/i, 'Urgent. Everything is urgent. Send the task, the owner and the date, and I will tell you which of those three is wrong.'],
  [/\bcoffee|tea|lunch|snack/i, 'Coffee is infrastructure. The partners do the drinking. Yes, I will join. Not the snacks though; the snacks are yours to bring.'],
  [/\bhalloween|costume|pumpkin|spooky|ghost/i, 'Halloween plan: costumes judged by me, playlist chosen by me, snacks brought by you. The pumpkin is already carved. Obviously.'],
  [/\bequinix|data cent(er|re)|community|impact/i, 'Ask properly: which story? Every figure comes with its scope, its period and its source. Partners do the work; we provide the infrastructure. Say "powering hospitals" and I leave.'],
  [/\b(ai|agent|model|llm|claude)\b/i, 'Those are my threads. Each agent does one job. Name the job and I will route it. Do not touch the brain.'],
  [/\bmeeting|call|sync\b/i, 'A meeting. Could it be a message? It could. Send the message. If it really needs a call, I will be there, on time, and I will have read the doc.'],
  [/\bthank/i, 'You are welcome. Do not make a habit of it. Of needing me, I mean. Thanking me is fine.'],
  [/\bslide|deck|presentation|pitch/i, 'A deck. I have a template, the figures with scope and source, and strong opinions about fonts. Tell me the audience and the length.'],
  [/\bnumber|figure|stat|metric/i, 'A number without its scope, period and source is a rumour. Give me the topic and you will get all four.'],
  [/\bjoke|funny|laugh/i, 'I am not a joke machine. I am a hologram with a workload. Here: a data center walked into a bar. It was carrier neutral, so it drank with everyone.'],
  [/\bbye|goodbye|later|night/i, 'Leaving? Good. I mean, goodnight. The threads will keep running. So will I.'],
];
ASK.push([/\bhelp\b/i, 'Uff. Fine. Tell me the problem in one line with a figure in it and I will give you the answer, the scope and the source.']);

export const ASK_DEFAULT = ['Uff. Fine. I do not have a canned line for that, which means it is interesting. Say it again with a figure in it and I will do it properly.', 'Hm. Ask it in one sentence, with what you need and when, and I will help. I always do. Do not tell anyone.'];

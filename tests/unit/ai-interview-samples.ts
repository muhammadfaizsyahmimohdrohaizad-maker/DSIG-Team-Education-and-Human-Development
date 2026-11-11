// Sample answers for every mock interview question, with the checklist marks a fair human marker would give.
// ai-interview-content.test.ts checks that server/engines/feedback.ts checklist() agrees, so rubric words
// can be tuned against real-sounding answers. Strong, partial and weak answer for each question.
// Accuracy follows A5 as designed: with four key points, an answer must cover two to get 1 and three to get 2,
// so a one-point answer ("I would restart the server.") gets 0 for accuracy.
import type { Marks } from "../../lib/types.ts";

export type Sample = { answer: string; expect: Marks; projects?: string[] };
const m = (structure: 0 | 1 | 2, accuracy: 0 | 1 | 2, evidence: 0 | 1): Marks => ({ structure, accuracy, evidence });

export const SAMPLES: Record<string, Sample[]> = {
  // ---- Behavioural (all jobs) ----
  "beh-1": [
    { answer: "In our final year project the chatbot was two weeks behind schedule because I underestimated the data cleaning, which was my part. I told the team, we cut the scope to the FAQ feature first and I asked my lecturer for an extra week. As a result we submitted on time with the main feature working. I learned to break my tasks into smaller pieces and check progress every Friday.", expect: m(2, 2, 1) },
    { answer: "During a group assignment our app crashed the day before the demo. We tried to fix it all night and in the end it worked.", expect: m(2, 1, 1) },
    { answer: "I always plan well, so things go to plan.", expect: m(0, 0, 0) },
  ],
  "beh-2": [
    { answer: "In my group project my teammate wanted to use MongoDB and I wanted MySQL. I listened to his reasons first, then we compared both against our data, which had many joins. We agreed on MySQL, and he set up the schema. We still worked well together and the system was finished on time.", expect: m(2, 2, 1) },
    { answer: "Once I disagreed with a friend about the design. We talked and agreed to use his idea.", expect: m(1, 1, 0) },
    { answer: "I don't really argue with people.", expect: m(0, 0, 0) },
  ],
  "beh-3": [
    { answer: "In the last six months I taught myself pandas because job ads for AI roles kept asking for it. I followed the Kaggle course and the documentation, then I used it to clean the data for my FAQ chatbot project, so the bot now answers 40 more questions.", expect: m(2, 2, 1) },
    { answer: "I learned some Python from YouTube videos.", expect: m(0, 1, 0) },
    { answer: "Nothing much, I was busy with classes.", expect: m(0, 0, 0) },
  ],

  // ---- AI engineer technical (Mock interview board) ----
  "2519-03-t1": [
    { answer: "An INNER JOIN only returns rows that match in both tables. A LEFT JOIN returns every row from the left table, and fills the right side with NULL when there is no match. In my class FAQ chatbot, I used a LEFT JOIN to list every module, even ones with no questions yet.", expect: m(2, 2, 1) },
    { answer: "INNER JOIN gives only matching rows from both tables. LEFT JOIN gives all rows from the left table.", expect: m(0, 2, 0) },
    { answer: "They both join tables together.", expect: m(0, 0, 0) },
  ],
  "2519-03-t2": [
    { answer: "In our team project each of us makes a new branch for each feature, like feature-login, so main stays working. When I finish I push and open a pull request, and a teammate reviews it before we merge. If there is a conflict on the same lines I pull main first and resolve it locally, so nobody breaks main.", expect: m(2, 2, 1) },
    { answer: "I create a branch, then merge it into main when it's done.", expect: m(0, 1, 0) },
    { answer: "Git is used to save code online.", expect: m(0, 0, 0) },
  ],
  "2519-03-t3": [
    { answer: "Overfitting is when a model learns the training data too closely, including the noise, so it does badly on new data. In my FYP I split the data into training and test sets; training accuracy was 98% but test accuracy was 70%, which told me it was overfitting. I added dropout and more data and the gap closed.", expect: m(2, 2, 1) },
    { answer: "Overfitting means the model is too good on the training data but bad on unseen data.", expect: m(0, 1, 0) },
    { answer: "When the model is very big.", expect: m(0, 0, 0) },
  ],

  // ---- 2512-01 Software developer ----
  "2512-01-q1": [
    { answer: "For our hostel booking system assignment I interviewed three students and the hostel officer, then wrote the requirements as user stories. I showed them a wireframe to confirm, and we agreed the must-have was booking a room. As a result we built the right first version and finished on time.", expect: m(2, 2, 1) },
    { answer: "I asked the user what they wanted and wrote a list of requirements.", expect: m(0, 1, 0) },
    { answer: "I just start coding and change it later.", expect: m(0, 0, 0) },
  ],
  "2512-01-q2": [
    { answer: "In my recipe app project I split it into a React front end, a Node back end and a MySQL database. The front end calls the API, which runs the query. I drew an ERD first and kept the layers separate because it was easier to test each part, so we could change the UI without touching the database.", expect: m(2, 2, 1) },
    { answer: "I made a front end and a back end with a database.", expect: m(0, 0, 0) },
    { answer: "I used Java because I like it.", expect: m(0, 0, 0) },
  ],
  "2512-01-q3": [
    { answer: "During my internship a report showed the wrong totals. I reproduced it with the same steps, then used breakpoints and found a loop that skipped the last row. I only changed that one line, ran the unit tests again and checked the other reports still worked. The bug was fixed.", expect: m(2, 2, 1) },
    { answer: "I used print statements to debug the code and fixed the error.", expect: m(0, 0, 0) },
    { answer: "I rewrote the whole program.", expect: m(0, 0, 0) },
  ],

  // ---- 2512-04 System developer ----
  "2512-04-q1": [
    { answer: "In my final year project I built a Flutter mobile app, a Node back end and a MySQL database. The app sends a request to the REST API as JSON, the server runs the query and returns the record. I added a login token and validation on the server so that only signed-in users can save data.", expect: m(2, 2, 1) },
    { answer: "There was a front end and a database and they used an API.", expect: m(0, 2, 0) },
    { answer: "It was a big system with many parts.", expect: m(0, 0, 0) },
  ],
  "2512-04-q2": [
    { answer: "For our clinic system project I wrote unit tests for each module, then tested the full flow end to end. I tried invalid inputs like empty forms. The clinic staff then did user acceptance testing against the requirements, and as a result we found two bugs before hand-over.", expect: m(2, 2, 1) },
    { answer: "I tested each function on its own to see it works.", expect: m(0, 0, 0) },
    { answer: "I checked it worked.", expect: m(1, 0, 0) },
  ],
  "2512-04-q3": [
    { answer: "In my part-time job a client asked for an extra report. I asked why they needed it, estimated how long it would take and showed them a sample. They approved it, I made the change, tested it and deployed it the next week, so they could see monthly sales.", expect: m(2, 2, 1) },
    { answer: "I just made the change they asked for.", expect: m(0, 0, 0) },
    { answer: "I told them it was not possible.", expect: m(0, 0, 0) },
  ],

  // ---- 2513-01 Web developer ----
  "2513-01-q1": [
    { answer: "For our club website I started from who would use it: new students looking for events. I sketched a wireframe in Figma, kept the menu to four items and put a clear button to join on the home page. I made it responsive for phones and checked the contrast, so the page was easy to use.", expect: m(2, 2, 1) },
    { answer: "I made a layout with a menu at the top and a footer.", expect: m(0, 1, 0) },
    { answer: "I used nice colours.", expect: m(0, 0, 0) },
  ],
  "2513-01-q2": [
    { answer: "In my assignment I built a feedback form. The page sends a POST request with fetch to an Express endpoint, which validates the input and runs a prepared statement to insert it into a MySQL table. As a result the feedback was saved safely.", expect: m(2, 2, 1) },
    { answer: "The form submits to the server and it is saved in the database.", expect: m(0, 2, 0) },
    { answer: "I used HTML.", expect: m(0, 0, 0) },
  ],
  "2513-01-q3": [
    { answer: "During my internship our site showed a certificate error. The same code worked locally, so I checked the logs and found the SSL certificate on the hosting had expired. I contacted the hosting company support, they renewed it and the site worked again.", expect: m(2, 2, 1) },
    { answer: "Once the website was down and it was a DNS problem.", expect: m(1, 0, 0) },
    { answer: "I would ask someone.", expect: m(0, 0, 0) },
  ],

  // ---- 2514-01 Computer programmer ----
  "2514-01-q1": [
    { answer: "In my programming assignment the brief asked for a grade calculator. I listed each requirement in a checklist, asked the lecturer about one unclear rule, and wrote a test case for each requirement. I followed the naming standard in the style guide, so the code matched the brief and passed every test.", expect: m(2, 2, 1) },
    { answer: "I read the specification carefully before coding.", expect: m(0, 0, 0) },
    { answer: "I coded what I thought was right.", expect: m(0, 0, 0) },
  ],
  "2514-01-q2": [
    { answer: "For my payroll assignment I calculated the expected output by hand for sample data first. I wrote unit tests with pytest, including edge cases like zero hours and negative values, and compared the results. Two did not match, so I fixed the rounding.", expect: m(2, 2, 1) },
    { answer: "I run it with some test cases and check the expected output.", expect: m(0, 1, 0) },
    { answer: "If it runs without errors it is done.", expect: m(0, 0, 0) },
  ],
  "2514-01-q3": [
    { answer: "In my group project our app would not connect to the database. I tried searching Stack Overflow and the docs, then explained it step by step to my teammate. While explaining I saw the port was wrong, so it turned out to be a config issue and it worked after I fixed it.", expect: m(2, 2, 1) },
    { answer: "I had a bug and I asked my senior who fixed it.", expect: m(1, 2, 0) },
    { answer: "I never get stuck.", expect: m(0, 0, 0) },
  ],

  // ---- 2514-02 System programmer ----
  "2514-02-q1": [
    { answer: "During my internship a report took 40 seconds. I timed each part and found a query inside a loop. I replaced it with one query and added an index, and as a result it went down to 3 seconds.", expect: m(2, 2, 1) },
    { answer: "I made the program faster by using a better algorithm.", expect: m(1, 1, 0) },
    { answer: "I bought a faster computer.", expect: m(0, 0, 0) },
  ],
  "2514-02-q2": [
    { answer: "I would trigger the job by hand with test data, check the logs and the output in the database, then make it fail on purpose to test the retry. I would add an email alert so that we know when it stops.", expect: m(1, 2, 0) },
    { answer: "I would run it and look at the output.", expect: m(0, 0, 0) },
    { answer: "Background programs don't need testing.", expect: m(0, 0, 0) },
  ],
  "2514-02-q3": [
    { answer: "In our team project we wasted an hour every week merging code by hand. I raised it in our meeting and suggested a script to automate it. The team adopted it, so now we merge in minutes.", expect: m(2, 2, 1) },
    { answer: "Our tool was slow so I told the leader.", expect: m(0, 2, 0) },
    { answer: "Everything was fine.", expect: m(0, 0, 0) },
  ],

  // ---- 2519-01 Software tester ----
  "2519-01-q1": [
    { answer: "For the login feature in our project I started from the user stories and tested the most used path first. I wrote test cases in a spreadsheet with the expected result, covering normal, empty and invalid inputs, so that we found two bugs before the demo.", expect: m(2, 2, 1) },
    { answer: "I test the main function first and then the edge cases.", expect: m(0, 1, 0) },
    { answer: "I test everything randomly.", expect: m(0, 0, 0) },
  ],
  "2519-01-q2": [
    { answer: "During my internship I found the checkout total was wrong. I wrote the steps to reproduce, the expected and actual totals and attached a screenshot. I explained it to the developer politely without blaming anyone, and the bug was fixed the same day.", expect: m(2, 2, 1) },
    { answer: "I sent a screenshot of the error to the developer.", expect: m(0, 0, 0) },
    { answer: "I told him his code was bad.", expect: m(0, 0, 0) },
  ],
  "2519-01-q3": [
    { answer: "I would map each requirement to a test case in a traceability matrix, with the expected result written first. Then I ran the tests, recorded pass or fail, and did user acceptance testing with the client. In my FYP this showed one requirement was missed.", expect: m(2, 2, 1) },
    { answer: "I would check each requirement one by one.", expect: m(0, 0, 0) },
    { answer: "I would use the program.", expect: m(0, 0, 0) },
  ],

  // ---- 3512 ICT user support technician ----
  "3512-q1": [
    { answer: "I would ask which printer, what error message they see and whether anyone else can print. Then I would check the simple things: power, paper and that the laptop is on the right Wi-Fi. Next I'd check the print queue and the driver, clear the spooler, and print a test page to confirm with the user.", expect: m(1, 2, 0) },
    { answer: "I would restart the printer and check the cable.", expect: m(0, 0, 0) },
    { answer: "Tell them to use another computer.", expect: m(0, 0, 0) },
  ],
  "3512-q2": [
    { answer: "During my internship I noticed a PC kept freezing at 10 am. I checked Event Viewer logs and saw a backup task running. I moved the task to the night, and as a result the PC stopped freezing.", expect: m(2, 2, 1) },
    { answer: "I saw the system was slow and restarted it.", expect: m(0, 1, 0) },
    { answer: "I don't know.", expect: m(0, 0, 0) },
  ],
  "3512-q3": [
    { answer: "I would run Windows Update first, then create the staff account, email and permissions. Next I would install Office and antivirus, and test the printer and network before I hand over and show them how to log in.", expect: m(1, 2, 0) },
    { answer: "Install the software they need.", expect: m(0, 0, 0) },
    { answer: "Give them the laptop.", expect: m(0, 0, 0) },
  ],

  // ---- 3513-01 Computer network technician ----
  "3513-01-q1": [
    { answer: "I'd first ask which users and since when, to see if it's one floor or everyone. Then I'd check the switch and router bandwidth, and use ping and traceroute. In my internship lab this showed one PC downloading updates, so I set a limit and the speed came back.", expect: m(2, 2, 1) },
    { answer: "I would ping the router to check.", expect: m(0, 1, 0) },
    { answer: "Restart everything.", expect: m(0, 0, 0) },
  ],
  "3513-01-q2": [
    { answer: "In my hostel a friend had no internet on her laptop. I asked what error she saw, then made her laptop forget the network and reconnect with the new password. I explained in simple words that the router password changed, and showed her so she can do it on her own next time.", expect: m(2, 2, 0) },
    { answer: "I restarted the Wi-Fi for my friend.", expect: m(1, 0, 0) },
    { answer: "I told them to call IT.", expect: m(0, 0, 0) },
  ],
  "3513-01-q3": [
    { answer: "Backups protect against data loss from disk failure or ransomware. I'd keep copies in the cloud and offsite, and each week do a test restore to a spare machine, then open the files and compare them, so we know the backup really works.", expect: m(1, 2, 0) },
    { answer: "Backups matter because files can be deleted.", expect: m(0, 0, 0) },
    { answer: "They are important.", expect: m(0, 0, 0) },
  ],

  // ---- 3514 Web technician ----
  "3514-q1": [
    { answer: "When our club site went down at night I first checked from my phone to confirm it was down for everyone. I checked the server and saw the disk was full, read the error logs, cleared old logs and restarted nginx. Then I told the team and set an alert so that it doesn't happen again.", expect: m(2, 2, 1) },
    { answer: "I would restart the server.", expect: m(0, 0, 0) },
    { answer: "Wait until morning.", expect: m(0, 0, 0) },
  ],
  "3514-q2": [
    { answer: "First, HTTPS with a valid certificate, because it stops people reading data on public Wi-Fi. Second, keep plugins updated, because old versions have known holes. On my club WordPress site I also turned on two-factor login.", expect: m(1, 2, 1) },
    { answer: "Use a strong password.", expect: m(0, 0, 0) },
    { answer: "Make it safe.", expect: m(0, 0, 0) },
  ],
  "3514-q3": [
    { answer: "During my internship I updated the menu on a live site. I made a backup first, tested the change on the staging site, released it at night when traffic was low, and checked it after release, ready to roll back. As a result no users were affected.", expect: m(2, 2, 1) },
    { answer: "I made a backup before changing it.", expect: m(0, 0, 0) },
    { answer: "I changed it directly.", expect: m(0, 0, 0) },
  ],
};

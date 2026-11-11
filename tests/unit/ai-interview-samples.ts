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
    { answer: "Once I disagreed with a friend about the design. We talked and agreed to use his idea.", expect: m(2, 1, 0) },
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

  // ---- 2524-03 Data analyst ----
  "2524-03-t1": [
    { answer: "In my internship I got sales data from three branches. I checked for missing and blank values, removed duplicate rows, made the date format consistent and looked for negative or impossible amounts. As a result I found 120 duplicates before the analysis.", expect: m(2, 2, 1) },
    { answer: "I would look for blank cells and fix them.", expect: m(0, 0, 0) },
    { answer: "I would just start making charts.", expect: m(0, 0, 0) },
  ],
  "2524-03-t2": [
    { answer: "First I'd clarify which branch and which product they mean, then compare last month with the same month last year. I'd break the data down by branch and product with a pivot table and double-check the totals before reporting, so the manager gets the real cause.", expect: m(1, 2, 0) },
    { answer: "I would compare it with the previous month.", expect: m(0, 0, 0) },
    { answer: "Sales go up and down.", expect: m(0, 0, 0) },
  ],
  "2524-03-t3": [
    { answer: "For my assignment I made a dashboard for the club treasurer. I started from her decision about which events to fund, used a bar chart for spending per event and a line chart for the trend, added clear titles and labels, and highlighted the key message, so she could see the two events that lost money.", expect: m(2, 2, 1) },
    { answer: "I made a pie chart with nice colours.", expect: m(0, 1, 0) },
    { answer: "I used Excel.", expect: m(0, 0, 0) },
  ],

  // ---- 2543-01 Web designer ----
  "2543-01-t1": [
    { answer: "For our club website project I talked to five members and did a short survey, then mapped the user flow for joining an event. I sketched a wireframe on paper and showed them for feedback, so we fixed the menu before any design work.", expect: m(2, 2, 1) },
    { answer: "I would draw a wireframe of the layout.", expect: m(0, 0, 0) },
    { answer: "I would make it look modern.", expect: m(0, 0, 0) },
  ],
  "2543-01-t2": [
    { answer: "In my UX assignment I made a clickable prototype in Figma and gave them three tasks, like booking a room. I watched where they struggled; two couldn't find the booking button, so I moved it to the top and renamed it. As a result all five users finished the task.", expect: m(2, 2, 1) },
    { answer: "I showed my Figma design to friends and they liked it.", expect: m(0, 0, 0) },
    { answer: "I didn't test it.", expect: m(0, 0, 0) },
  ],
  "2543-01-t3": [
    { answer: "In my portfolio project I built the page with semantic HTML and CSS grid, made it responsive with media queries for phones, and checked contrast and alt text. For the developer I shared a style guide with colours, fonts and spacing, so the build matched the design.", expect: m(2, 2, 1) },
    { answer: "I export the design and send it to the developer.", expect: m(0, 0, 0) },
    { answer: "The developer does that part.", expect: m(0, 0, 0) },
  ],

  // ---- 2511-01 MIS analyst ----
  "2511-01-t1": [
    { answer: "During my internship the finance manager couldn't see overdue invoices. I asked the manager which decisions she makes each week, walked through how the current system works, compared that with what she needed and found the gap: no ageing report. I wrote a one-page summary and she agreed it.", expect: m(2, 2, 1) },
    { answer: "I would ask the manager what they need.", expect: m(0, 0, 0) },
    { answer: "I would buy a new system.", expect: m(0, 0, 0) },
  ],
  "2511-01-t2": [
    { answer: "For our clinic system assignment I wrote user stories with acceptance criteria, drew a data flow diagram and a mock-up of the new screen, marked which ones were must-have, and the clinic staff signed off before the developers started, so we built the right thing.", expect: m(2, 2, 1) },
    { answer: "I write a list of requirements for the developers.", expect: m(0, 0, 0) },
    { answer: "I tell the developers what to do.", expect: m(0, 0, 0) },
  ],
  "2511-01-t3": [
    { answer: "In my internship I made a Power BI dashboard of monthly sales from the ERP database. I cleaned duplicates and missing rows, then cross-checked the totals against the finance team's manual count; they matched, so the managers trusted it.", expect: m(2, 2, 1) },
    { answer: "I made a report in Excel with a chart.", expect: m(0, 0, 0) },
    { answer: "I printed the data.", expect: m(0, 0, 0) },
  ],

  // ---- 2523-01 Network specialist ----
  "2523-01-t1": [
    { answer: "I'd first count the users and devices and the bandwidth they need. Then I'd choose a router with a firewall, a managed switch and two access points, put staff, printers and guests on separate VLANs with DHCP, and draw a topology diagram so the next person can follow it.", expect: m(1, 2, 0) },
    { answer: "I would buy a router and a switch.", expect: m(0, 0, 0) },
    { answer: "Use the Wi-Fi from the phone company.", expect: m(0, 0, 0) },
  ],
  "2523-01-t2": [
    { answer: "In my internship one floor kept dropping. I found it was only one department and happened every afternoon, checked the switch port lights and cables, then used ping and the switch logs. A faulty cable was the cause; I replaced it and confirmed the link stayed stable.", expect: m(2, 2, 1) },
    { answer: "I would ping the router and restart it.", expect: m(0, 0, 0) },
    { answer: "Call the internet provider.", expect: m(0, 0, 0) },
  ],
  "2523-01-t3": [
    { answer: "I'd use a firewall with clear rules, put guests on a separate VLAN with WPA3, and keep firmware patched and monitored. For growth I'd plan bandwidth and capacity for twice the staff and a VPN to the cloud services, so it scales without a redesign.", expect: m(1, 2, 0) },
    { answer: "Use a strong Wi-Fi password and a firewall.", expect: m(0, 0, 0) },
    { answer: "Networks are safe if you have antivirus.", expect: m(0, 0, 0) },
  ],

  // ---- 2531-04 Cybersecurity analyst ----
  "2531-04-t1": [
    { answer: "Signs include many failed logins, unusual traffic at night or an unknown process. In my lab project I collected the logs in a SIEM, compared them with a normal baseline and set alerts for spikes, so we caught a brute-force test within minutes.", expect: m(2, 2, 1) },
    { answer: "Lots of failed logins can mean an attack.", expect: m(0, 0, 0) },
    { answer: "When the computer is slow.", expect: m(0, 0, 0) },
  ],
  "2531-04-t2": [
    { answer: "I would reset their password and lock the account to contain it, then investigate the logs to see which systems were accessed. I'd scan the laptop, turn on two-factor login, report it to the IT manager and run a short phishing awareness reminder for staff.", expect: m(0, 2, 0) },
    { answer: "I would reset the password.", expect: m(0, 0, 0) },
    { answer: "Tell them to be careful next time.", expect: m(0, 0, 0) },
  ],
  "2531-04-t3": [
    { answer: "In my capstone I scanned our test server with Nmap and OpenVAS, checked for missing patches and default passwords, and ranked what I found by risk. I wrote a report with the fix steps for each critical one, so the team fixed three before the demo.", expect: m(2, 2, 1) },
    { answer: "I would run a vulnerability scan.", expect: m(0, 0, 0) },
    { answer: "Wait for an attack and then fix it.", expect: m(0, 0, 0) },
  ],

  // ---- 2144-06 Robotics technologist ----
  "2144-06-t1": [
    { answer: "For my final year project I built a line-following robot with an Arduino, two motors and IR sensors. I wrote the control code with a PID loop and tested each sensor step by step, then measured it on the track 20 times; it finished 18, so I tuned the code.", expect: m(2, 2, 1) },
    { answer: "I built a robot with an Arduino.", expect: m(0, 0, 0) },
    { answer: "I like robots.", expect: m(0, 0, 0) },
  ],
  "2144-06-t2": [
    { answer: "I'd reproduce the fault with the same task, then check the sensor readings on the serial monitor, check the power and wiring with a multimeter for loose connections, and add print statements to the code to see which condition stops the arm.", expect: m(0, 2, 0) },
    { answer: "I would check the wiring.", expect: m(0, 0, 0) },
    { answer: "Replace the robot arm.", expect: m(0, 0, 0) },
  ],
  "2144-06-t3": [
    { answer: "In our robotics club I change one thing at a time and commit each change to Git, so I can go back to the old version. Then I re-test the whole task at low speed with the emergency stop ready before running it at full speed. As a result nothing broke after my fixes.", expect: m(2, 2, 1) },
    { answer: "I test it after changing the code.", expect: m(0, 0, 0) },
    { answer: "I just upload the new code.", expect: m(0, 0, 0) },
  ],
};

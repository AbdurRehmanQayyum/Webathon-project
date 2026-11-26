using CampusConnect.Domain.Enums;

namespace CampusConnect.Infrastructure.Seeding;

internal sealed record DemoUser(
    string Key, string FullName, byte? Semester, string? RegistrationNumber,
    string? Title = null, bool IsAdmin = false, string? Bio = null);

internal sealed record DemoClub(
    string Key, string Name, string Category, string Description, string[] Moderators, string[] Members);

internal sealed record DemoComment(string Author, string Body, params DemoComment[] Replies);

internal sealed record DemoPost(
    string Club, string Author, string Title, int HoursAgo,
    string? Body = null, string? Link = null, bool Pinned = false,
    string[]? Upvotes = null, DemoComment[]? Comments = null);

internal sealed record DemoAnnouncement(
    string Author, string Title, string Body, int DaysAgo,
    bool Important = false, bool Published = true, string? Link = null, string? LinkLabel = null,
    string? FileName = null, string? FileText = null);

internal sealed record DemoEvent(
    string Title, string Description, string Venue, EventCategory Category,
    int DayOffset, int StartHour, int Hours, string? CancellationReason = null);

internal static class DemoContent
{
    public const string EmailDomain = "campusconnect.test";

    public static readonly DemoUser[] Users =
    [
        new("admin", "Dr. Ayesha Rahman", null, null, "Head of Department", true),
        new("headcr", "Bilal Ahmed", 7, "CS-23-001", "Head CR", true),
        new("headgr", "Sana Tariq", 7, "CS-23-002", "Head GR", true),
        new("moderator", "Hamza Malik", 6, "CS-23-041", Bio: "Machine learning and data tooling."),
        new("fatima.noor", "Fatima Noor", 5, "CS-24-012", Bio: "Front-end developer who enjoys accessibility work."),
        new("usman.khalid", "Usman Khalid", 7, "CS-23-027", Bio: "CTF player and Linux user."),
        new("zainab.ali", "Zainab Ali", 5, "CS-24-033"),
        new("student", "Ali Raza", 3, "CS-25-018", Bio: "Third semester, learning web development."),
        new("mariam.shah", "Mariam Shah", 3, "CS-25-022"),
        new("hassan.iqbal", "Hassan Iqbal", 4, "CS-25-009"),
        new("areeba.khan", "Areeba Khan", 2, "CS-26-014"),
        new("daniyal.hussain", "Daniyal Hussain", 6, "CS-23-055"),
        new("iqra.javed", "Iqra Javed", 5, "CS-24-047"),
        new("saad.mehmood", "Saad Mehmood", 1, "CS-26-061"),
        new("hira.saleem", "Hira Saleem", 8, "CS-22-030")
    ];

    public static readonly DemoClub[] Clubs =
    [
        new("ai", "Artificial Intelligence Club", "Artificial Intelligence",
            "Reading groups, model experiments and project help for machine learning and AI courses.",
            ["moderator"], ["student", "hassan.iqbal", "areeba.khan", "daniyal.hussain", "hira.saleem", "iqra.javed"]),
        new("web", "Web Development Society", "Software Development",
            "Front-end, back-end and deployment discussions, code reviews and weekend build sessions.",
            ["fatima.noor"], ["student", "mariam.shah", "areeba.khan", "saad.mehmood", "iqra.javed", "daniyal.hussain"]),
        new("security", "Cybersecurity Club", "Cybersecurity",
            "Defensive security, capture-the-flag practice and responsible disclosure for CS students.",
            ["usman.khalid"], ["hassan.iqbal", "saad.mehmood", "daniyal.hussain", "mariam.shah"]),
        new("cp", "Competitive Programming Club", "Competitive Programming",
            "Weekly problem sets, contest upsolving and interview-style algorithm practice.",
            ["zainab.ali"], ["student", "hassan.iqbal", "areeba.khan", "hira.saleem", "saad.mehmood"]),
        new("data", "Data Science Community", "Data Science",
            "Statistics, visualisation and dataset projects, from first notebooks to final year research.",
            ["moderator"], ["iqra.javed", "hira.saleem", "mariam.shah"]),
        new("games", "Game Development Club", "Game Development",
            "Engines, game jams and playtesting for students building 2D and 3D games.",
            [], ["saad.mehmood", "daniyal.hussain", "areeba.khan"]),
        new("oss", "Open Source Society", "Open Source",
            "Find first issues, learn Git workflows and contribute to public projects together.",
            ["usman.khalid"], ["student", "hira.saleem", "daniyal.hussain"]),
        new("academics", "CS Academic Support", "Academics",
            "Course questions, shared notes and exam preparation across every semester.",
            ["zainab.ali"], ["student", "mariam.shah", "areeba.khan", "saad.mehmood", "hassan.iqbal", "iqra.javed"])
    ];

    public static readonly DemoPost[] Posts =
    [
        new("academics", "zainab.ali", "Read this first: how to ask for course help", 400,
            "Include the course code, what you already tried, and the exact error or question. Do not post graded solutions before the deadline. Answers that explain the reasoning help everyone more than final results.",
            Pinned: true, Upvotes: ["student", "mariam.shah", "areeba.khan"]),
        new("academics", "mariam.shah", "How are you preparing for the Data Structures midterm?", 6,
            "I am comfortable with linked lists and stacks, but tree rotations still confuse me. What order did you revise the topics in, and which problems were most useful?",
            Upvotes: ["student", "areeba.khan", "saad.mehmood", "zainab.ali"],
            Comments:
            [
                new("zainab.ali", "Draw every rotation by hand for a week. Start with the two single rotations before the double ones.",
                    new DemoComment("mariam.shah", "That helps. Should I memorise the code too?",
                        new DemoComment("zainab.ali", "Understand the pointer changes and the code follows naturally."))),
                new("student", "Past papers from the library helped me see which question styles repeat.")
            ]),
        new("academics", "hassan.iqbal", "Free reference for algorithm implementations", 52,
            Body: "Clear explanations with working code. Useful for revising graph topics.",
            Link: "https://cp-algorithms.com/", Upvotes: ["student", "zainab.ali"]),
        new("web", "fatima.noor", "Saturday build session: bring a small project", 30,
            "We will spend two hours in Lab 3 reviewing each other's work. Bring anything: a portfolio page, an API, or a half-finished idea. Beginners are welcome.",
            Pinned: true, Upvotes: ["student", "mariam.shah", "areeba.khan", "iqra.javed", "daniyal.hussain"],
            Comments:
            [
                new("student", "Can I bring a plain HTML and CSS page? I have not started React yet.",
                    new DemoComment("fatima.noor", "Absolutely. That is a great place to start a review.")),
                new("iqra.javed", "I can help anyone who wants to check their layout on small screens.")
            ]),
        new("web", "student", "When should I move from plain JavaScript to a framework?", 11,
            "I have built a to-do list and a small quiz with plain JavaScript. I keep hearing that I should learn React next. What should I be comfortable with first?",
            Upvotes: ["areeba.khan", "saad.mehmood"],
            Comments:
            [
                new("daniyal.hussain", "Once you are comfortable with array methods, promises and the DOM, a framework will make much more sense.")
            ]),
        new("web", "areeba.khan", "MDN guides are better than most video playlists", 75,
            Body: "The learning area walks through HTML, CSS and JavaScript in a sensible order.",
            Link: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
            Upvotes: ["student", "fatima.noor", "saad.mehmood"]),
        new("ai", "moderator", "Reading group: your first neural network paper", 26,
            "Next week we will read an introductory paper on backpropagation. Skim it beforehand and write down one thing you did not understand. No prior research experience needed.",
            Pinned: true, Upvotes: ["student", "hassan.iqbal", "hira.saleem", "iqra.javed"],
            Comments: [new("hira.saleem", "Happy to walk through the maths section if anyone wants a recap on chain rule.")]),
        new("ai", "hassan.iqbal", "My model reaches 99% training accuracy and 61% on validation", 9,
            "I am classifying leaf images with about 800 samples. Dropout did not change much. Is this just too little data?",
            Upvotes: ["student", "moderator", "areeba.khan"],
            Comments:
            [
                new("moderator", "Classic overfitting. Try augmentation and start from a pretrained network, freezing the early layers.",
                    new DemoComment("hassan.iqbal", "Transfer learning took validation to 84%. Thank you.")),
                new("hira.saleem", "Also check that near-duplicate photos are not split across both sets.")
            ]),
        new("ai", "daniyal.hussain", "Google's machine learning crash course", 120,
            Link: "https://developers.google.com/machine-learning/crash-course", Upvotes: ["hassan.iqbal"]),
        new("cp", "zainab.ali", "Weekly problem set: sliding window", 20,
            "Five problems, ordered by difficulty. Post your approach in the comments rather than full code so others can still try.",
            Pinned: true, Upvotes: ["student", "hassan.iqbal", "areeba.khan"],
            Comments: [new("areeba.khan", "Problem three is where I learned to shrink the window with a while loop, not an if.")]),
        new("cp", "saad.mehmood", "How do you stop getting time limit exceeded?", 44,
            "My solutions give the right answer on samples but time out on larger tests. How do I estimate this before submitting?",
            Upvotes: ["student", "zainab.ali"],
            Comments:
            [
                new("zainab.ali", "Read the constraints first. With n up to 100000, an O(n squared) approach will not pass.")
            ]),
        new("security", "usman.khalid", "Practise only on systems you have permission to test", 200,
            "Use the club lab and intentionally vulnerable practice machines. Testing university or third-party systems without written permission is not allowed and can end your membership.",
            Pinned: true, Upvotes: ["hassan.iqbal", "mariam.shah", "daniyal.hussain"]),
        new("security", "mariam.shah", "OWASP Top Ten is a good starting checklist", 33,
            Body: "I used it to review my course project and found two missing access checks.",
            Link: "https://owasp.org/www-project-top-ten/", Upvotes: ["usman.khalid", "saad.mehmood"],
            Comments: [new("usman.khalid", "Good habit. Broken access control is worth testing on every endpoint you write.")]),
        new("data", "iqra.javed", "Which chart for comparing five departments over four years?", 61,
            "A grouped bar chart looks crowded. What would you use instead?",
            Upvotes: ["hira.saleem"],
            Comments: [new("moderator", "Small multiples: one line chart per department with a shared scale.")]),
        new("data", "hira.saleem", "Short courses with hands-on notebooks", 150,
            Link: "https://www.kaggle.com/learn", Upvotes: ["iqra.javed", "mariam.shah"]),
        new("games", "daniyal.hussain", "Looking for an artist for a 2D puzzle game", 15,
            "I have the movement and level loading working in Godot. If you enjoy pixel art or simple vector work, reply here.",
            Upvotes: ["saad.mehmood", "areeba.khan"],
            Comments: [new("areeba.khan", "I would like to try the tile set. Can you share the grid size?")]),
        new("oss", "usman.khalid", "A guide to making your first contribution", 90,
            Link: "https://opensource.guide/how-to-contribute/",
            Body: "Read the contributing file of a project before opening a pull request.",
            Upvotes: ["student", "hira.saleem", "daniyal.hussain"]),
        new("oss", "student", "I opened my first pull request", 3,
            "It was a small documentation fix, and the maintainer merged it the same day. The hardest part was rebasing, so I wrote down the steps for next time.",
            Upvotes: ["usman.khalid", "hira.saleem"],
            Comments: [new("hira.saleem", "Congratulations. Documentation fixes are real contributions.")])
    ];

    public static readonly DemoAnnouncement[] Announcements =
    [
        new("admin", "Mid-semester examination schedule released",
            "The mid-semester examinations begin in two weeks. Check your section's timings in the attached schedule and report clashes to the department office within three working days.",
            1, Important: true, FileName: "midterm-schedule.txt",
            FileText: "CS Department - Mid-semester schedule (sample data)\r\n\r\nMonday    Data Structures\r\nTuesday   Database Systems\r\nWednesday Operating Systems\r\nThursday  Software Engineering\r\n"),
        new("headcr", "Final year project proposals due next Friday",
            "Final year groups must submit a two page proposal naming the problem, scope and supervisor. Late proposals will move to the following review round.",
            4),
        new("headgr", "Computer lab hours extended during exam weeks",
            "Labs 1 to 3 will stay open until 8:00 PM on weekdays during the examination period. Carry your department card.",
            8),
        new("admin", "Club registrations are open for this semester",
            "Browse the clubs on Campus Connect and join the ones that match your interests. If a topic is missing, submit a club request for review.",
            16, Link: "https://opensource.guide/building-community/", LinkLabel: "Guide to building a student community"),
        new("admin", "Industry mentorship programme",
            "Draft: details of the mentorship programme will be confirmed with partner organisations before publication.",
            0, Published: false)
    ];

    public static readonly DemoEvent[] Events =
    [
        new("Orientation for new CS students", "Meet the faculty, class representatives and club moderators.",
            "Main Auditorium", EventCategory.Social, -38, 10, 3),
        new("Git and GitHub fundamentals workshop", "Branching, pull requests and resolving merge conflicts, with guided practice.",
            "Lab 3, CS Block", EventCategory.Workshop, -18, 14, 2),
        new("Inter-semester programming contest", "Teams of three solve eight problems in three hours.",
            "Lab 1, CS Block", EventCategory.Competition, -9, 10, 3),
        new("Open source contribution evening", "Pair up and work on beginner-friendly issues.",
            "Room 204", EventCategory.Workshop, -3, 16, 2, "The lab was needed for a rescheduled examination."),
        new("Introduction to machine learning workshop", "Train a first classifier and learn how to evaluate it honestly. Bring a laptop.",
            "Lab 2, CS Block", EventCategory.Workshop, 1, 14, 3),
        new("Final year project proposal reviews", "Ten minute presentations followed by faculty feedback.",
            "Seminar Hall", EventCategory.Academic, 4, 9, 4),
        new("Cloud platforms seminar", "An overview of deploying student projects to managed hosting.",
            "Seminar Hall", EventCategory.Seminar, 6, 11, 2, "The speaker is unavailable. A new date will be announced."),
        new("Capture the flag practice round", "Beginner and intermediate challenges on the isolated club lab.",
            "Lab 3, CS Block", EventCategory.Competition, 11, 13, 4),
        new("Software engineering careers seminar", "Alumni share how they prepared for interviews and first jobs.",
            "Main Auditorium", EventCategory.Seminar, 19, 11, 2),
        new("Weekend game jam", "Build a small game around a theme announced on the day.",
            "CS Common Room", EventCategory.Social, 33, 10, 8)
    ];
}

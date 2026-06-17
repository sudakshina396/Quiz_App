import React, { useEffect, useState } from "react";

interface Question {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

const Quiz = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [started, setStarted] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("");

  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  const [amount, setAmount] = useState<string>("10");
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [marks, setMarks] = useState<number>(2);

  const [timeLeft, setTimeLeft] = useState<number>(15);

  const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const questionCount = Number(amount) || 10;

      const categoryParam = category ? `&category=${category}` : "";

      const res = await fetch(
        `https://opentdb.com/api.php?amount=${questionCount}${categoryParam}&difficulty=${difficulty}&type=multiple`
      );

      const data = await res.json();

      const formatted = data.results.map((q: Question) => ({
        ...q,
        question: decodeHtml(q.question),
        correct_answer: decodeHtml(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(decodeHtml),
      }));

      setQuestions(formatted);
      setStarted(true);
      setFinished(false);
      setCurrentQuestion(0);
      setScore(0);
      setTimeLeft(15);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextMove = (finalScore?: number) => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((prev) => prev + 1);
      setTimeLeft(15);
    } else {
      const scoreToSave = finalScore ?? score;

      const oldScores = JSON.parse(
        localStorage.getItem("quizScores") || "[]"
      );

      oldScores.push({
        name: playerName.trim() || "Unknown Player",
        score: scoreToSave,
        total: questions.length * marks,
        date: new Date().toLocaleString(),
      });

      localStorage.setItem("quizScores", JSON.stringify(oldScores));

      setFinished(true);
    }
  };

  const handleAnswer = (answer: string) => {
    let newScore = score;

    if (answer === questions[currentQuestion].correct_answer) {
      newScore = score + marks;
    } else {
      newScore = Math.max(0, score - marks);
    }

    setScore(newScore);
    nextMove(newScore);
  };

  useEffect(() => {
    if (!started || finished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, finished, currentQuestion]);

  useEffect(() => {
    if (timeLeft <= 0) nextMove();
  }, [timeLeft]);

  useEffect(() => {
    if (questions.length === 0) return;

    const q = questions[currentQuestion];

    let options =
      marks === 2
        ? [
            q.correct_answer,
            q.incorrect_answers[
              Math.floor(Math.random() * q.incorrect_answers.length)
            ],
          ]
        : [...q.incorrect_answers, q.correct_answer];

    setShuffledOptions([...options].sort(() => Math.random() - 0.5));
  }, [questions, currentQuestion, marks]);

  const restartQuiz = () => {
    setStarted(false);
    setFinished(false);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(15);
    setPlayerName("");
    setAmount("10");
    setDifficulty("easy");
    setMarks(2);
  };

 
  if (!started) {
    return (
      <div className="quiz-container">
        <h1 className="quiz-title">Quiz App</h1>

        <input
          className="form-control quiz-input"
          placeholder="Enter Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <br />

        <input
          className="form-control quiz-input"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <br />

        <select
          className="form-select quiz-select"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <br />

        <select
          className="form-select quiz-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Any Category</option>
          <option value="9">General Knowledge</option>
          <option value="18">Computers</option>
          <option value="19">Math</option>
          <option value="21">Sports</option>
        </select>

        <br />

        <select
          className="form-select quiz-select"
          value={marks}
          onChange={(e) => setMarks(Number(e.target.value))}
        >
          <option value={2}>2 Marks</option>
          <option value={4}>4 Marks</option>
          <option value={6}>6 Marks</option>
        </select>

        <br />

        <button
          className="btn quiz-btn"
          onClick={fetchQuestions}
          disabled={loading || !playerName.trim()}
        >
          {loading ? "Loading..." : "Start Quiz"}
        </button>
      </div>
    );
  }


  if (finished) {
    const totalMarks = questions.length * marks;

    const percentage =
      totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    const leaderboard = JSON.parse(
      localStorage.getItem("quizScores") || "[]"
    ).sort((a: any, b: any) => b.score - a.score);

    return (
      <div className="quiz-container">
        <h1 className="quiz-title">Quiz Finished 🎉</h1>

        <h2 className="score">Player: {playerName}</h2>
        <h2 className="score">Final Score: {score}</h2>

        <h3>
          {percentage <= 20
            ? `${playerName} 😩 Better luck next time`
            : `${playerName} 🎉 You Won!`}
        </h3>

        <h3>Total Questions: {questions.length}</h3>

        <div className="leaderboard">
          <h3>🏆 Leaderboard</h3>

          {leaderboard.slice(0, 10).map((item: any, index: number) => (
            <div key={index} className="leaderboard-item">
              {index + 1}. {item.name} - {item.score}/{item.total}
            </div>
          ))}
        </div>

        <button
          className="btn quiz-btn"
          onClick={() => {
            localStorage.removeItem("quizScores");
            window.location.reload();
          }}
        >
          Clear Leaderboard
        </button>

        <br />

        <button className="btn quiz-btn" onClick={restartQuiz}>
          Play Again
        </button>

        <button
          className="btn quiz-btn"
          onClick={() => alert("Thanks for playing!")}
        >
          Quit
        </button>
      </div>
    );
  }

  
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <h2>
        Question {currentQuestion + 1} / {questions.length}
      </h2>

      <h3 className="timer">⏳ Time Left: {timeLeft}s</h3>

      <div className="progress mb-3">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h3>{question.question}</h3>

      <div className="d-flex flex-column gap-2 mt-3">
        {shuffledOptions.map((option, index) => (
          <button
            key={index}
            className="btn option-btn"
            onClick={() => handleAnswer(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Quiz;

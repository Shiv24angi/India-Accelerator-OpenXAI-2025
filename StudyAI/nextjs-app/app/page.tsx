// nextjs-app/app/page.tsx
'use client'

import { useState, useEffect } from 'react' // Import useEffect
import { v4 as uuidv4 } from 'uuid' // Import uuid for unique IDs

// Interface definitions for existing features
interface Flashcard {
  front: string
  back: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

// New interface definitions for Study Planner
interface Goal {
  id: string
  description: string
  targetDate: string | null // Storing dates as ISO strings
  completed: boolean
}

interface StudyPlan {
  userId: string
  goals: Goal[];
  subjects: string[];
  lastUpdated: string // Storing date as ISO string
}

// Helper to convert Date objects to a readable date string
const formatLocalDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString();
};

export default function LearnAI() {
  const [activeTab, setActiveTab] = useState('studyPlanner') // Set Study Planner as default active tab
  const [loading, setLoading] = useState(false)

  // Flashcard states
  const [notes, setNotes] = useState('')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Quiz states
  const [quizText, setQuizText] = useState('')
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  // Study Buddy states
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [chatHistory, setChatHistory] = useState<{ question: string, answer: string }[]>([])

  // Study Planner states
  const userId = 'localUser123'; // Fixed userId for local storage
  const localStorageKey = `studyPlan_${userId}`; // Unique key for this user's data
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [studyPlannerError, setStudyPlannerError] = useState<string | null>(null); // Separate error state for clarity

  // --- Study Planner: Load from Local Storage on Mount ---
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(localStorageKey);
      if (storedPlan) {
        setStudyPlan(JSON.parse(storedPlan));
      } else {
        const defaultPlan: StudyPlan = {
          userId: userId,
          goals: [],
          subjects: [],
          lastUpdated: new Date().toISOString(),
        };
        setStudyPlan(defaultPlan);
        localStorage.setItem(localStorageKey, JSON.stringify(defaultPlan));
      }
    } catch (e: any) {
      console.error("Error loading study plan from local storage:", e);
      setStudyPlannerError("Failed to load study plan from local storage.");
    }
  }, []); // Runs once on mount

  // --- Study Planner: Save to Local Storage whenever studyPlan changes ---
  useEffect(() => {
    if (studyPlan) { // Only save if studyPlan is initialized
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(studyPlan));
      } catch (e: any) {
        console.error("Error saving study plan to local storage:", e);
        setStudyPlannerError("Failed to save study plan to local storage.");
      }
    }
  }, [studyPlan]); // Runs whenever studyPlan changes

  // --- Study Planner: Handler functions ---
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalDescription.trim()) return;

    setLoading(true);
    try {
      const newGoal: Goal = {
        id: uuidv4(),
        description: newGoalDescription.trim(),
        targetDate: newGoalTargetDate ? new Date(newGoalTargetDate).toISOString() : null,
        completed: false,
      };

      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: [...(currentPlan.goals || []), newGoal],
          lastUpdated: new Date().toISOString(),
        };
      });
      setNewGoalDescription('');
      setNewGoalTargetDate('');
    } catch (err: any) {
      console.error("Error adding goal:", err);
      setStudyPlannerError("Failed to add goal.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGoalCompletion = (goalId: string) => {
    if (!studyPlan) return;

    setLoading(true);
    try {
      const updatedGoals = studyPlan.goals.map((goal: Goal) =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      );
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: updatedGoals,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error("Error toggling goal completion:", err);
      setStudyPlannerError("Failed to update goal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!studyPlan) return;

    setLoading(true);
    try {
      const updatedGoals = studyPlan.goals.filter((goal: Goal) => goal.id !== goalId);
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: updatedGoals,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error("Error deleting goal:", err);
      setStudyPlannerError("Failed to delete goal.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    setLoading(true);
    try {
      const updatedSubjects = [...(studyPlan?.subjects || []), newSubject.trim()];
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          subjects: Array.from(new Set(updatedSubjects)), // Ensure unique subjects
          lastUpdated: new Date().toISOString(),
        };
      });
      setNewSubject('');
    } catch (err: any) {
      console.error("Error adding subject:", err);
      setStudyPlannerError("Failed to add subject.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = (subjectToDelete: string) => {
    if (!studyPlan) return;

    setLoading(true);
    try {
      const updatedSubjects = studyPlan.subjects.filter((subject: string) => subject !== subjectToDelete);
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          subjects: updatedSubjects,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error("Error deleting subject:", err);
      setStudyPlannerError("Failed to delete subject.");
    } finally {
      setLoading(false);
    }
  };

  // Study Planner: Calculate progress safely
  const currentGoals = studyPlan?.goals || [];
  const incompleteGoals = currentGoals.filter(g => !g.completed);
  const completedGoals = currentGoals.filter(g => g.completed);
  const completedGoalsCount = completedGoals.length;
  const totalGoalsCount = currentGoals.length;
  const progressWidth = totalGoalsCount > 0 ? (completedGoalsCount / totalGoalsCount) * 100 : 0;


  // Flashcard methods
  const generateFlashcards = async () => {
    if (!notes.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      const data = await response.json()
      if (data.flashcards) {
        setFlashcards(data.flashcards)
        setCurrentCard(0)
        setFlipped(false)
      }
    } catch (error) {
      console.error('Error generating flashcards:', error)
    }
    setLoading(false)
  }

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1)
      setFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setFlipped(false)
    }
  }

  // Quiz methods
  const generateQuiz = async () => {
    if (!quizText.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: quizText })
      })

      const data = await response.json()
      if (data.quiz) {
        setQuiz(data.quiz)
        setCurrentQuestion(0)
        setSelectedAnswer(null)
        setShowResults(false)
        setScore(0)
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
    }
    setLoading(false)
  }

  const selectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)

    if (answerIndex === quiz[currentQuestion].correct) {
      setScore(score + 1)
    }

    setTimeout(() => {
      if (currentQuestion < quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
      } else {
        setShowResults(true)
      }
    }, 1500)
  }

  // Study Buddy methods
  const askStudyBuddy = async () => {
    if (!question.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/study-buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const data = await response.json()
      if (data.answer) {
        const newChat = { question, answer: data.answer }
        setChatHistory(prev => [...prev, newChat])
        setAnswer(data.answer)
        setQuestion('')
      }
    } catch (error) {
      console.error('Error asking study buddy:', error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-50 mb-4">📚 LearnAI</h1>
          <p className="text-gray-400 text-lg">AI-Powered Educational Tools</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-2 rounded-lg flex space-x-2 shadow-inner">
            {[
              { id: 'flashcards', label: '🃏 Flashcards', desc: 'Make Flashcards' },
              { id: 'quiz', label: '📝 Quiz', desc: 'Create Quiz' },
              { id: 'study-buddy', label: '🤖 Study Buddy', desc: 'Ask Questions' },
              { id: 'studyPlanner', label: '📚 Study Planner', desc: 'Set Goals' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-transparent text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="text-sm font-medium">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">🃏 Flashcard Maker</h2>

              {flashcards.length === 0 ? (
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste your study notes here and I'll create flashcards for you..."
                    className="w-full h-40 p-4 rounded-lg border-0 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={generateFlashcards}
                    disabled={loading || !notes.trim()}
                    className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Generating...' : 'Generate Flashcards'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-gray-300">
                    Card {currentCard + 1} of {flashcards.length}
                  </div>
                  <div
                    className={`flashcard ${flipped ? 'flipped' : ''} mb-6 cursor-pointer`}
                    onClick={() => setFlipped(!flipped)}
                  >
                    <div className="flashcard-inner">
                      <div className="flashcard-front">
                        <p className="text-lg font-medium">{flashcards[currentCard]?.front}</p>
                      </div>
                      <div className="flashcard-back">
                        <p className="text-lg">{flashcards[currentCard]?.back}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={prevCard}
                      disabled={currentCard === 0}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFlashcards([])}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      New Flashcards
                    </button>
                    <button
                      onClick={nextCard}
                      disabled={currentCard === flashcards.length - 1}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">📝 Quiz Maker</h2>

              {quiz.length === 0 && !showResults ? (
                <div>
                  <textarea
                    value={quizText}
                    onChange={(e) => setQuizText(e.target.value)}
                    placeholder="Paste text here and I'll create a quiz for you..."
                    className="w-full h-40 p-4 rounded-lg border-0 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={generateQuiz}
                    disabled={loading || !quizText.trim()}
                    className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Creating Quiz...' : 'Create Quiz'}
                  </button>
                </div>
              ) : showResults ? (
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-white mb-4">Quiz Complete!</h3>
                  <p className="text-xl text-gray-300 mb-6">
                    You scored {score} out of {quiz.length} ({Math.round((score / quiz.length) * 100)}%)
                  </p>
                  <button
                    onClick={() => {
                      setQuiz([])
                      setShowResults(false)
                      setScore(0)
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Take Another Quiz
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-gray-300">
                    Question {currentQuestion + 1} of {quiz.length}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {quiz[currentQuestion]?.question}
                    </h3>

                    <div className="space-y-3">
                      {quiz[currentQuestion]?.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => selectAnswer(index)}
                          disabled={selectedAnswer !== null}
                          className={`w-full p-4 text-left rounded-lg transition-all quiz-option ${
                            selectedAnswer === null
                              ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                              : selectedAnswer === index
                                ? index === quiz[currentQuestion].correct
                                  ? 'correct'
                                  : 'incorrect'
                                : index === quiz[currentQuestion].correct
                                  ? 'correct'
                                  : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {selectedAnswer !== null && (
                      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                        <p className="text-gray-200 font-medium">Explanation:</p>
                        <p className="text-gray-400">{quiz[currentQuestion]?.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Study Buddy Tab */}
          {activeTab === 'study-buddy' && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">🤖 Ask-Me Study Buddy</h2>

              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask me anything you want to learn about..."
                    className="flex-1 p-4 rounded-lg border-0 bg-gray-700 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && askStudyBuddy()}
                  />
                  <button
                    onClick={askStudyBuddy}
                    disabled={loading || !question.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Thinking...' : 'Ask'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatHistory.map((chat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-200 font-medium">You:</p>
                      <p className="text-gray-400">{chat.question}</p>
                    </div>
                    <div className="bg-blue-900/40 p-4 rounded-lg">
                      <p className="text-blue-300 font-medium">Study Buddy:</p>
                      <p className="text-gray-300">{chat.answer}</p>
                    </div>
                  </div>
                ))}

                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-400 py-8 italic">
                    Ask me anything and I'll help you learn! I can explain concepts, provide examples, and answer your questions.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Study Planner Tab */}
          {activeTab === 'studyPlanner' && (
            <div className="bg-gray-800 rounded-xl p-6 text-gray-100 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">📚 Your Study Planner</h2>
              <p className="text-gray-400 mb-6">
                Hello, <span className="font-bold">{userId || 'Guest'}</span>! Track your progress and set your goals.
              </p>

              {studyPlannerError && (
                <div className="p-4 mb-4 bg-red-900/40 text-red-300 rounded-lg">
                  Error: {studyPlannerError}
                </div>
              )}

              {/* Add New Goal */}
              <div className="bg-gray-700 p-6 rounded-xl shadow-inner mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Set a New Study Goal</h3>
                <form onSubmit={handleAddGoal} className="space-y-4">
                  <input
                    type="text"
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                    placeholder="e.g., Master React Hooks"
                    className="w-full p-3 rounded-lg border-0 bg-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="date"
                    value={newGoalTargetDate}
                    onChange={(e) => setNewGoalTargetDate(e.target.value)}
                    className="w-full p-3 rounded-lg border-0 bg-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newGoalDescription.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Adding Goal...' : 'Add Goal'}
                  </button>
                </form>
              </div>

              {/* Your Incomplete Study Goals */}
              <div className="bg-gray-700 p-6 rounded-xl shadow-inner mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Your Active Goals</h3>
                {incompleteGoals.length > 0 ? (
                  <ul className="space-y-3">
                    {incompleteGoals.map((goal: Goal) => (
                      <li
                        key={goal.id}
                        className={`flex items-center justify-between p-4 rounded-lg transition-colors bg-gray-600`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={goal.completed}
                            onChange={() => handleToggleGoalCompletion(goal.id)}
                            className="mr-3 h-5 w-5 appearance-none border-2 border-blue-400 rounded-md bg-transparent checked:bg-blue-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-gray-700 transition duration-200"
                          />
                          <span className={`text-lg text-gray-100`}>
                            {goal.description}
                            {goal.targetDate && (
                              <span className="text-sm text-gray-400 ml-2"> (Target: {formatLocalDate(goal.targetDate)})</span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-all rounded-full hover:bg-gray-500"
                          aria-label="Delete goal"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No active goals. Time to set some new challenges!</p>
                )}
              </div>

              {/* Your Completed Study Goals */}
              <div className="bg-gray-700 p-6 rounded-xl shadow-inner mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">✅ Completed Goals</h3>
                {completedGoals.length > 0 ? (
                  <ul className="space-y-3">
                    {completedGoals.map((goal: Goal) => (
                      <li
                        key={goal.id}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all bg-gray-600`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={goal.completed}
                            onChange={() => handleToggleGoalCompletion(goal.id)}
                            className="mr-3 h-5 w-5 appearance-none border-2 border-green-400 rounded-md bg-transparent checked:bg-green-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-gray-700 transition duration-200"
                          />
                          <span className={`text-lg line-through text-gray-400`}>
                            {goal.description}
                            {goal.targetDate && (
                              <span className="text-sm text-gray-500 ml-2"> (Target: {formatLocalDate(goal.targetDate)})</span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-all rounded-full hover:bg-gray-500"
                          aria-label="Delete goal"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No goals completed yet. Keep pushing!</p>
                )}
              </div>

              {/* Your Subjects */}
              <div className="bg-gray-700 p-6 rounded-xl shadow-inner mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Your Subjects</h3>
                <form onSubmit={handleAddSubject} className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Add a subject (e.g., Biology)"
                    className="flex-grow p-3 rounded-lg border-0 bg-gray-600 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newSubject.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </form>
                {studyPlan?.subjects && studyPlan.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {studyPlan.subjects.map((subject: string) => (
                      <span
                        key={subject}
                        className="inline-flex items-center bg-blue-800/50 text-blue-200 text-sm font-medium px-3 py-1.5 rounded-full"
                      >
                        {subject}
                        <button
                          onClick={() => handleDeleteSubject(subject)}
                          className="ml-2 -mr-1 h-4 w-4 text-gray-400 hover:text-gray-100"
                          aria-label={`Remove ${subject}`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No subjects added yet.</p>
                )}
              </div>

              {/* Progress Dashboard */}
              <div className="bg-gray-700 p-6 rounded-xl shadow-inner">
                <h3 className="text-xl font-semibold text-white mb-4">Your Progress Dashboard</h3>
                <p className="text-gray-400">
                  Track your overall goal completion here.
                </p>
                <div className="mt-4 w-full bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressWidth}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {completedGoalsCount} out of {totalGoalsCount} goals completed. ({progressWidth.toFixed(0)}%)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .flashcard {
          background-color: var(--card-bg, #2c2c2c);
          border-radius: 0.75rem;
          padding: 1.5rem;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #e0e0e0;
          font-size: 1.125rem;
          perspective: 1000px;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flashcard.flipped {
          transform: rotateY(180deg);
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flashcard-front, .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flashcard-back {
          transform: rotateY(180deg);
        }
        .quiz-option.correct {
          background-color: #388e3c !important; /* Muted Green */
          color: white !important;
        }
        .quiz-option.incorrect {
          background-color: #d32f2f !important; /* Muted Red */
          color: white !important;
        }
      `}</style>
    </div>
  )
}
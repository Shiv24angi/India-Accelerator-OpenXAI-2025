// nextjs-app/components/StudyPlanner.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for goals

// Helper to convert Date objects to a readable date string
const formatLocalDate = (dateString: string | null) => { // Added type annotation for dateString
  if (!dateString) return 'N/A';
  // Attempt to parse if it's an ISO string or other date string
  const date = new Date(dateString);
  // Check if the date is valid before formatting
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString();
};

// Define types for better type safety
interface Goal {
  id: string;
  description: string;
  targetDate: string | null; // Storing dates as ISO strings
  completed: boolean;
}

interface StudyPlan {
  userId: string;
  goals: Goal[];
  subjects: string[];
  lastUpdated: string; // Storing date as ISO string
}

const StudyPlanner = () => {
  // We'll use a fixed userId for local storage as it's not multi-user by nature
  const userId = 'localUser123';
  const localStorageKey = `studyPlan_${userId}`; // Unique key for this user's data

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null); // Use StudyPlan interface
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Load Study Plan from Local Storage on Mount ---
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(localStorageKey);
      if (storedPlan) {
        setStudyPlan(JSON.parse(storedPlan));
        console.log('Study plan loaded from local storage:', JSON.parse(storedPlan));
      } else {
        // Initialize with a default plan if nothing found
        const defaultPlan: StudyPlan = { // Use StudyPlan interface for default plan
          userId: userId,
          goals: [],
          subjects: [],
          lastUpdated: new Date().toISOString(), // Use ISO string for Date
        };
        setStudyPlan(defaultPlan);
        localStorage.setItem(localStorageKey, JSON.stringify(defaultPlan));
        console.log("No study plan found in local storage, created a default one.");
      }
    } catch (e: any) { // Type e as any for catch block
      console.error("Error loading study plan from local storage:", e);
      setError("Failed to load study plan from local storage.");
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  // --- Save Study Plan to Local Storage whenever it changes ---
  useEffect(() => {
    if (studyPlan && !loading) { // Only save if studyPlan is initialized and not in initial loading phase
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(studyPlan));
        console.log('Study plan saved to local storage.');
      } catch (e: any) { // Type e as any for catch block
        console.error("Error saving study plan to local storage:", e);
        setError("Failed to save study plan to local storage.");
      }
    }
  }, [studyPlan, loading]); // Runs whenever studyPlan or loading state changes

  const handleAddGoal = (e: React.FormEvent) => { // Added type annotation for event
    e.preventDefault();
    if (!newGoalDescription.trim()) return;

    setLoading(true);
    try {
      const newGoal: Goal = { // Use Goal interface for new goal
        id: uuidv4(),
        description: newGoalDescription.trim(),
        targetDate: newGoalTargetDate ? new Date(newGoalTargetDate).toISOString() : null, // Store as ISO string
        completed: false,
      };

      setStudyPlan((prevPlan: StudyPlan | null) => { // Added type annotation for prevPlan
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: [...(currentPlan.goals || []), newGoal],
          lastUpdated: new Date().toISOString(),
        };
      });
      setNewGoalDescription('');
      setNewGoalTargetDate('');
      console.log('Goal added successfully');
    } catch (err: any) { // Type err as any for catch block
      console.error("Error adding goal:", err);
      setError("Failed to add goal.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGoalCompletion = (goalId: string) => { // Added type annotation for goalId
    if (!studyPlan) return;

    setLoading(true);
    try {
      const updatedGoals = studyPlan.goals.map((goal: Goal) => // Added type annotation for goal
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      );
      setStudyPlan((prevPlan: StudyPlan | null) => { // Added type annotation for prevPlan
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: updatedGoals,
          lastUpdated: new Date().toISOString(),
        };
      });
      console.log('Goal completion toggled');
    } catch (err: any) { // Type err as any for catch block
      console.error("Error toggling goal completion:", err);
      setError("Failed to update goal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => { // Added type annotation for goalId
    if (!studyPlan) return;

    setLoading(true);
    try {
      const updatedGoals = studyPlan.goals.filter((goal: Goal) => goal.id !== goalId); // Added type annotation for goal
      setStudyPlan((prevPlan: StudyPlan | null) => { // Added type annotation for prevPlan
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: updatedGoals,
          lastUpdated: new Date().toISOString(),
        };
      });
      console.log('Goal deleted');
    } catch (err: any) { // Type err as any for catch block
      console.error("Error deleting goal:", err);
      setError("Failed to delete goal.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => { // Added type annotation for event
    e.preventDefault();
    if (!newSubject.trim()) return;

    setLoading(true);
    try {
      const updatedSubjects = [...(studyPlan?.subjects || []), newSubject.trim()];
      setStudyPlan((prevPlan: StudyPlan | null) => { // Added type annotation for prevPlan
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          subjects: Array.from(new Set(updatedSubjects)), // Ensure unique subjects
          lastUpdated: new Date().toISOString(),
        };
      });
      setNewSubject('');
      console.log('Subject added successfully');
    } catch (err: any) { // Type err as any for catch block
      console.error("Error adding subject:", err);
      setError("Failed to add subject.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = (subjectToDelete: string) => { // Added type annotation for subjectToDelete
    if (!studyPlan) return;

    setLoading(true);
    try {
      const updatedSubjects = studyPlan.subjects.filter((subject: string) => subject !== subjectToDelete); // Added type annotation for subject
      setStudyPlan((prevPlan: StudyPlan | null) => { // Added type annotation for prevPlan
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          subjects: updatedSubjects,
          lastUpdated: new Date().toISOString(),
        };
      });
      console.log('Subject deleted');
    } catch (err: any) { // Type err as any for catch block
      console.error("Error deleting subject:", err);
      setError("Failed to delete subject.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress safely by first ensuring studyPlan.goals is treated as an array
  const currentGoals = studyPlan?.goals || []; // Default to empty array if studyPlan or goals is null/undefined
  const completedGoalsCount = currentGoals.filter(g => g.completed).length;
  const totalGoalsCount = currentGoals.length;
  const progressWidth = totalGoalsCount > 0 ? (completedGoalsCount / totalGoalsCount) * 100 : 0;


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Study Plan...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600 font-bold">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <h1 className="text-4xl font-extrabold text-indigo-800 text-center mb-6">
        📚 Your Study Planner
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Hello, <span className="font-bold text-indigo-700">{userId || 'Guest'}</span>! Track your progress and set your goals.
      </p>

      {/* Add New Goal */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Set a New Study Goal</h2>
        <form onSubmit={handleAddGoal} className="space-y-4">
          <input
            type="text"
            value={newGoalDescription}
            onChange={(e) => setNewGoalDescription(e.target.value)}
            placeholder="e.g., Master React Hooks"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition duration-200"
            required
          />
          <input
            type="date"
            value={newGoalTargetDate}
            onChange={(e) => setNewGoalTargetDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition duration-200"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 shadow-md"
          >
            Add Goal
          </button>
        </form>
      </div>

      {/* Your Study Goals */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
        <h2 className="2xl font-semibold text-indigo-700 mb-4">Your Study Goals</h2>
        {studyPlan?.goals && studyPlan.goals.length > 0 ? (
          <ul className="space-y-3">
            {studyPlan.goals.map((goal: Goal) => ( // Added type annotation for goal
              <li
                key={goal.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition duration-200 ${
                  goal.completed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => handleToggleGoalCompletion(goal.id)}
                    className="mr-3 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className={`text-lg ${goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {goal.description}
                    {goal.targetDate && (
                      <span className="text-sm text-gray-500 ml-2"> (Target: {formatLocalDate(goal.targetDate)})</span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-2 text-red-500 hover:text-red-700 transition duration-200 rounded-full hover:bg-red-100"
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
          <p className="text-gray-500 italic">No goals set yet. Start adding some!</p>
        )}
      </div>

      {/* Your Subjects */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Your Subjects</h2>
        <form onSubmit={handleAddSubject} className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add a subject (e.g., Biology)"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition duration-200"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 shadow-md"
          >
            Add
          </button>
        </form>
        {studyPlan?.subjects && studyPlan.subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {studyPlan.subjects.map((subject: string) => ( // Added type annotation for subject
              <span
                key={subject}
                className="inline-flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-full"
              >
                {subject}
                <button
                  onClick={() => handleDeleteSubject(subject)}
                  className="ml-2 -mr-1 h-4 w-4 text-indigo-600 hover:text-indigo-800"
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
          <p className="text-gray-500 italic">No subjects added yet.</p>
        )}
      </div>

      {/* Progress Dashboard - Placeholder for future integration */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Your Progress Dashboard</h2>
        <p className="text-gray-600">
          This section will display your quiz scores, flashcard mastery, and study session durations over time.
          (Future integration with `progressLogs` collection and potentially AI-driven insights).
        </p>
        {/* Example: A simple progress bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${progressWidth}%` }} // Using the safely calculated progressWidth
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {completedGoalsCount} out of {totalGoalsCount} goals completed.
        </p>
      </div>
    </div>
  );
};

export default StudyPlanner;

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'daily-todos'

function readSavedTodos() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function App() {
  const [todoList, setTodoList] = useState(readSavedTodos)
  const [todo, setTodo] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todoList))
    } catch {
      // Todos remain available for this session when browser storage is unavailable.
    }
  }, [todoList])

  const addTodo = (event) => {
    event.preventDefault()
    const title = todo.trim()
    if (!title) return

    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    setTodoList((items) => [{ id, title, isCompleted: false }, ...items])
    setTodo('')
  }

  const toggleTodo = (id) => {
    setTodoList((items) => items.map((item) =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item,
    ))
  }

  const deleteTodo = (id) => {
    setTodoList((items) => items.filter((item) => item.id !== id))
    if (editingId === id) cancelEdit()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditTitle(item.title)
  }

  const saveEdit = (event, id) => {
    event.preventDefault()
    const title = editTitle.trim()
    if (!title) return
    setTodoList((items) => items.map((item) => item.id === id ? { ...item, title } : item))
    cancelEdit()
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
  }

  const clearCompleted = () => {
    setTodoList((items) => items.filter((item) => !item.isCompleted))
  }

  const completedCount = todoList.filter((item) => item.isCompleted).length
  const completedTodos = todoList.filter((item) => item.isCompleted)
  const activeCount = todoList.length - completedCount
  const visibleTodos = todoList.filter((item) => {
    const matchesFilter = filter === 'all'
      || (filter === 'active' && !item.isCompleted)
      || (filter === 'completed' && item.isCompleted)
    return matchesFilter && item.title.toLowerCase().includes(search.trim().toLowerCase())
  })

  return (
    <main className="page-shell">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="app-header">
          <div className="brand-mark" aria-hidden="true">✓</div>
          <span className="brand-name">DAYMARK</span>
          <span className="header-note">A little more focus, every day</span>
        </header>

        <div className="intro">
          <p className="eyebrow">YOUR PERSONAL SPACE</p>
          <h1 id="page-title">Make today count.</h1>
          <p className="subtitle">Keep the important things moving, one task at a time.</p>
        </div>

        <div className="summary-row" aria-live="polite">
          <div className="summary-number">{activeCount}</div>
          <div className="summary-copy">
            <strong>{activeCount === 1 ? 'task left' : 'tasks left'}</strong>
            <span>{completedCount === 0 ? 'A fresh start is a good start.' : `${completedCount} completed so far`}</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Todo completion"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={todoList.length ? Math.round((completedCount / todoList.length) * 100) : 0}
          >
            <span style={{ width: `${todoList.length ? (completedCount / todoList.length) * 100 : 0}%` }} />
          </div>
        </div>

        <form className="add-form" onSubmit={addTodo}>
          <label className="sr-only" htmlFor="new-todo">Add a task</label>
          <input
            id="new-todo"
            type="text"
            value={todo}
            onChange={(event) => setTodo(event.target.value)}
            placeholder="What would you like to get done?"
            maxLength={160}
          />
          <button className="primary-button" type="submit" disabled={!todo.trim()}>
            <span aria-hidden="true">＋</span> Add task
          </button>
        </form>

        <div className="list-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filter tasks">
            {['all', 'active', 'completed'].map((value) => (
              <button
                className={filter === value ? 'filter-tab selected' : 'filter-tab'}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
                aria-pressed={filter === value}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search tasks</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
          </label>
        </div>

        <ul className="todo-list">
          {visibleTodos.map((item) => (
            <li className={item.isCompleted ? 'todo-item completed' : 'todo-item'} key={item.id}>
              {editingId === item.id ? (
                <form className="edit-form" onSubmit={(event) => saveEdit(event, item.id)}>
                  <input
                    autoFocus
                    aria-label="Edit task title"
                    value={editTitle}
                    maxLength={160}
                    onChange={(event) => setEditTitle(event.target.value)}
                    onKeyDown={(event) => event.key === 'Escape' && cancelEdit()}
                  />
                  <button className="icon-button save-button" type="submit" disabled={!editTitle.trim()} aria-label="Save changes">✓</button>
                  <button className="icon-button" type="button" onClick={cancelEdit} aria-label="Cancel editing">×</button>
                </form>
              ) : (
                <>
                  <button
                    className="check-button"
                    type="button"
                    onClick={() => toggleTodo(item.id)}
                    aria-label={item.isCompleted ? `Mark ${item.title} active` : `Complete ${item.title}`}
                    aria-pressed={item.isCompleted}
                  >
                    {item.isCompleted && <span aria-hidden="true">✓</span>}
                  </button>
                  <span className="todo-title">{item.title}</span>
                  <div className="item-actions">
                    <button className="icon-button" type="button" onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}>✎</button>
                    <button className="icon-button delete-button" type="button" onClick={() => deleteTodo(item.id)} aria-label={`Delete ${item.title}`}>×</button>
                  </div>
                </>
              )}
            </li>
          ))}
          {visibleTodos.length === 0 && (
            <li className="empty-state">
              <span className="empty-icon" aria-hidden="true">{todoList.length ? '⌕' : '✦'}</span>
              <strong>{todoList.length ? 'No matching tasks' : 'Your list is clear'}</strong>
              <span>{todoList.length ? 'Try another search or filter.' : 'Add a task above and get started.'}</span>
            </li>
          )}
        </ul>

        <footer className="list-footer">
          <span>{activeCount} {activeCount === 1 ? 'task' : 'tasks'} remaining</span>
          <button type="button" onClick={clearCompleted} disabled={completedCount === 0}>
            Clear completed{completedCount > 0 ? ` (${completedCount})` : ''}
          </button>
        </footer>

        <section className="completed-section" aria-labelledby="completed-title">
          <div className="completed-heading">
            <div>
              <p className="eyebrow">YOUR PROGRESS</p>
              <h2 id="completed-title">Completed tasks</h2>
            </div>
            <span className="completed-count">{completedCount}</span>
          </div>
          {completedTodos.length > 0 ? (
            <div className="completed-table-wrap">
              <table className="completed-table">
                <thead>
                  <tr><th scope="col">Task</th><th scope="col">Status</th></tr>
                </thead>
                <tbody>
                  {completedTodos.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td><span className="done-badge"><span aria-hidden="true">✓</span> Done</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="completed-empty">Tasks you complete will appear here.</p>
          )}
        </section>
      </section>
      <p className="page-caption">Small steps add up. You’ve got this.</p>
    </main>
  )
}

export default App

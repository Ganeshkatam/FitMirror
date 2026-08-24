import { Skill, Intent, SkillResult } from './engine'

// --- Registry ---
const skills: Skill[] = []

export function registerSkill(skill: Skill) {
    skills.push(skill)
}

export function getBestSkill(intent: Intent): Skill | null {
    // Find first skill that claims to handle this intent
    // In future: Scoring system
    return skills.find(s => s.canHandle(intent)) || null
}

// --- Built-in Skills Definitions ---
// (We will move these to separate files if they grow)

export const NavigationSkill: Skill = {
    id: 'core.navigation',
    name: 'Navigator',
    description: 'Handles app routing',
    canHandle: (intent) => intent.type === 'NAVIGATE',
    execute: async (intent, { router }) => {
        const target = intent.payload.target
        if (router && target) {
            return {
                success: true,
                message: `Navigating to ${target}`,
                action: () => router.push(target)
            }
        }
        return { success: false, message: "Router context missing" }
    }
}

export const ThemeSkill: Skill = {
    id: 'core.theme',
    name: 'Theme Controller',
    description: 'Toggles UI theme',
    canHandle: (intent) => intent.type === 'ACTION' && intent.payload.action === 'SET_THEME',
    execute: async (intent, { setTheme }) => {
        const theme = intent.payload.value
        if (setTheme) {
            return {
                success: true,
                message: `Switching to ${theme} mode`,
                action: () => setTheme(theme)
            }
        }
        return { success: false, message: "Theme context missing" }
    }
}

export const SearchSkill: Skill = {
    id: 'core.search',
    name: 'Search Engine',
    description: 'Searches for products',
    canHandle: (intent) => intent.type === 'SEARCH',
    execute: async (intent, { router }) => {
        const query = intent.payload.query
        if (router && query) {
            return {
                success: true,
                message: `Searching for "${query}"...`,
                action: () => router.push(`/shop?q=${encodeURIComponent(query)}`)
            }
        }
        return { success: false, message: "Context missing or empty query" }
    }
}

export const StyleAdviceSkill: Skill = {
    id: 'core.style_advice',
    name: 'Style Assistant',
    description: 'Provides personalized fashion advice',
    canHandle: (intent) => intent.type === 'STYLE_ADVICE',
    execute: async (intent, context) => {
        try {
            const res = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: intent.payload.query,
                    context: { type: 'style_advice' }
                })
            })
            const data = await res.json()

            if (res.ok && data.message) {
                return {
                    success: true,
                    message: data.message,
                    data: data.products // Pass products if available for future UI enhancement
                }
            }
            return { success: false, message: "I couldn't generate advice right now." }
        } catch (e) {
            return { success: false, message: "Connection failed." }
        }
    }
}

// Register Core
registerSkill(NavigationSkill)
registerSkill(ThemeSkill)
registerSkill(SearchSkill)
registerSkill(StyleAdviceSkill)


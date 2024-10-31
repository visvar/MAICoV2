import { writable, get, derived } from 'svelte/store';

export const iter = writable(1)

export const genlength = writable(64)

export const recording = writable(false)

export const playing = writable(false)

export const midiinputs = writable([])

export const selectedMidiInput = writable({ label: 'none', value: 0 })

export const playingHighlight = writable(null)

export const recordedNotes = writable([])

export const playrecord = writable(true)

export const midiplayer = writable(null)

export const midiplayerSingle = writable(null)

export const lastidPrimer = writable(0)

export const selectedMeloColors = writable(null)

export const ableton = writable(false)

export const ngrokUrl = writable(null)

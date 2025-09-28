interface Setting<T> {
  value: T
  key: string
  serializable: boolean
}

export interface Settings {
  theme: Setting<string>
  allowRudeWords: Setting<boolean>
  guaranteeRareLetter: Setting<boolean>
  dyslexicMode: Setting<boolean>
  disableAnimations: Setting<boolean>
}

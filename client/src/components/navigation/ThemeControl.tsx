import { useTheme } from '@/app/providers/theme-context'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

export function ThemeControl() {
  const { preference, setPreference } = useTheme()

  return (
    <SegmentedControl
      label="Theme"
      value={preference}
      onChange={setPreference}
      segments={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
      ]}
      className="w-full sm:w-72"
    />
  )
}

import { PreferencesForm } from '@/components/account/preferences-form'
import { AccountLayout } from '@/components/account/account-layout'

export default function PreferencesPage() {
    return (
        <AccountLayout title="My Preferences" description="Customize your shopping experience.">
            <PreferencesForm />
        </AccountLayout>
    )
}

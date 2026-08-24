import { LoadingWidget } from '@/components/ui/loading-widget'

export default function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <LoadingWidget size="lg" text="Securing connection..." />
            </div>
        </div>
    )
}

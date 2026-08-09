import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-xl">Verifikasi Email</CardTitle>
                    <CardDescription>
                        Terima kasih telah mendaftar! Silakan verifikasi alamat email Anda melalui tautan yang baru saja kami kirimkan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status === 'verification-link-sent' && (
                        <div className="mb-4 text-sm font-medium text-emerald-600">
                            Tautan verifikasi baru telah dikirimkan ke alamat email yang Anda berikan saat pendaftaran.
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="flex items-center justify-between pt-2">
                            <Button type="submit" disabled={processing}>
                                Kirim Ulang Email Verifikasi
                            </Button>

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="text-sm text-muted-foreground underline hover:text-foreground"
                            >
                                Log Out
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </GuestLayout>
    );
}
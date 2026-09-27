<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(
            \Laravel\Fortify\Contracts\LoginResponse::class,
            \App\Http\Responses\LoginResponse::class
        );

        $this->app->singleton(
            \Laravel\Fortify\Contracts\RegisterResponse::class,
            \App\Http\Responses\RegisterResponse::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();

        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $resetUrl = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            return (new MailMessage)
                ->subject('MDRRMO Opol - Password Reset Request')
                ->greeting('Hello ' . ($notifiable->first_name ?? 'User') . ',')
                ->line('You are receiving this email because a password reset request was received for your MDRRMO Opol account.')
                ->action('Reset Password', $resetUrl)
                ->line('This password reset link will expire in 60 minutes.')
                ->line('If you did not request a password reset, no further action is required and your account remains secure.');
        });

        Fortify::authenticateUsing(function (Request $request) {
            $login = trim((string) $request->input('email', ''));
            $password = (string) $request->input('password', '');

            if ($login === '' || $password === '') {
                return null;
            }

            $user = \App\Models\User::where(function ($query) use ($login) {
                $query->where('email', $login)
                      ->orWhereRaw('LOWER(email) = ?', [strtolower($login)])
                      ->orWhere('phone_number', $login);
            })->first();

            if ($user && (\Illuminate\Support\Facades\Hash::check($password, $user->password) || \Illuminate\Support\Facades\Hash::check(trim($password), $user->password))) {
                if ($user->role === 'responder') {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'email' => 'Responder accounts can only access the MDRRMO mobile application. Please use the Responder mobile app to continue.',
                    ]);
                }

                if ($user->role === 'resident') {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'email' => 'Resident accounts can only access the MDRRMO mobile application. Please use the Resident mobile app to continue.',
                    ]);
                }

                if (! in_array($user->role, ['admin', 'dispatcher'])) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'email' => 'This account is not authorized to access the web application.',
                    ]);
                }

                return $user;
            }

            return null;
        });
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

    }
}

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MDRRMO Opol - Account Credentials</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #e2e8f0;
            line-height: 1.6;
        }
        .container {
            max-width: 580px;
            margin: 30px auto;
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        }
        .header {
            background: linear-gradient(135deg, #e11d48 0%, #ea580c 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .header p {
            margin: 6px 0 0 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 32px 28px;
        }
        .greeting {
            font-size: 17px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 12px;
        }
        .text {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 20px;
        }
        .credentials-box {
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(225, 29, 72, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
        }
        .credential-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .credential-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .credential-row:first-child {
            padding-top: 0;
        }
        .credential-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
        }
        .credential-value {
            font-size: 14px;
            font-weight: 600;
            color: #f8fafc;
        }
        .password-highlight {
            font-family: 'Courier New', Courier, monospace;
            font-size: 18px;
            font-weight: 700;
            color: #fb7185;
            background: rgba(225, 29, 72, 0.15);
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px dashed rgba(225, 29, 72, 0.4);
            display: inline-block;
        }
        .badge {
            display: inline-block;
            padding: 3px 10px;
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .alert-box {
            background: rgba(245, 158, 11, 0.1);
            border-left: 4px solid #f59e0b;
            padding: 14px 16px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
        }
        .alert-box p {
            margin: 0;
            font-size: 13px;
            color: #fbbf24;
            line-height: 1.5;
        }
        .alert-box strong {
            color: #fef3c7;
        }
        .btn-wrapper {
            text-align: center;
            margin: 28px 0 16px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #e11d48 0%, #ea580c 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 12px rgba(225, 29, 72, 0.4);
        }
        .btn-mobile {
            background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%) !important;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4) !important;
        }
        .btn-outline {
            display: inline-block;
            background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: #cbd5e1 !important;
            text-decoration: none;
            padding: 9px 22px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            letter-spacing: 0.3px;
            box-shadow: none;
        }
        .footer {
            background: rgba(15, 23, 42, 0.5);
            padding: 20px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 12px;
            color: #64748b;
        }
        .footer p {
            margin: 4px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MDRRMO OPOL</h1>
            <p>Municipal Disaster Risk Reduction & Management Office</p>
        </div>

        <div class="content">
            <div class="greeting">
                Hello {{ $user->first_name }} {{ $user->last_name }},
            </div>

            <p class="text">
                @if($user->role === 'responder')
                    @if($isReset)
                        Your MDRRMO Responder account password has been reset by an administrator. Below are your new temporary credentials for the MDRRMO Mobile App and Portal:
                    @else
                        A new Responder account has been created for you on the MDRRMO Emergency Response System. As a responder, you will receive emergency assignments, live routes, and patient records on the <strong>MDRRMO Mobile App</strong>. Below are your initial credentials:
                    @endif
                @else
                    @if($isReset)
                        Your MDRRMO Dispatcher account password has been reset by an administrator. Below are your new temporary credentials to access the dispatch portal:
                    @else
                        A new Dispatcher staff account has been created for you on the MDRRMO Emergency Response System. Below are your initial credentials to access the operational console:
                    @endif
                @endif
            </p>

            <div class="credentials-box">
                <div class="credential-row">
                    <span class="credential-label">Account Role</span>
                    <span class="credential-value">
                        <span class="badge">{{ ucfirst($user->role) }}</span>
                    </span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Registered Email</span>
                    <span class="credential-value">{{ $user->email }}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Temporary Password</span>
                    <span class="credential-value">
                        <span class="password-highlight">{{ $temporaryPassword }}</span>
                    </span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Validity</span>
                    <span class="credential-value" style="color: #f59e0b; font-size: 12px;">Expires in 24 hours</span>
                </div>
            </div>

            <div class="alert-box">
                <p>
                    <strong>Mandatory Password Change:</strong> This temporary password is for <strong>initial access only</strong>. When you first log in, you will be required to create your permanent secure password before accessing system operations.
                </p>
            </div>

            @if($user->role === 'responder')
                <div class="btn-wrapper">
                    <a href="{{ route('app.download') }}" class="btn btn-mobile" target="_blank">
                        📲 Download MDRRMO Mobile App
                    </a>
                    <div style="margin-top: 12px;">
                        <a href="{{ url('/login') }}" class="btn-outline" target="_blank">
                            💻 Sign In & Change Password via Web
                        </a>
                    </div>
                </div>

                <p class="text" style="font-size: 12px; text-align: center; margin-top: 20px; color: #94a3b8; line-height: 1.6;">
                    Mobile App Download Link:<br>
                    <a href="{{ route('app.download') }}" style="color: #38bdf8; word-break: break-all;">{{ route('app.download') }}</a><br><br>
                    Web Portal Access:<br>
                    <a href="{{ url('/login') }}" style="color: #38bdf8; word-break: break-all;">{{ url('/login') }}</a>
                </p>
            @else
                <div class="btn-wrapper">
                    <a href="{{ url('/login') }}" class="btn" target="_blank">
                        💻 Sign In to Dispatcher Portal
                    </a>
                </div>

                <p class="text" style="font-size: 12px; text-align: center; margin-top: 24px;">
                    If the button above does not work, copy and paste this URL into your browser:<br>
                    <a href="{{ url('/login') }}" style="color: #38bdf8; word-break: break-all;">{{ url('/login') }}</a>
                </p>
            @endif
        </div>

        <div class="footer">
            <p><strong>Emergency Operations Center</strong> • Municipality of Opol, Misamis Oriental</p>
            <p>This is an automated system email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>

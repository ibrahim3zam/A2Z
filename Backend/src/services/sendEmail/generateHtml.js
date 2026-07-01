export const template = (
  code,
  title = 'Welcome to A2Z Decoration',
  text = 'Please click the button below to verify your email address.'
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f7f6;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: #4CAF50;
                color: #ffffff;
                text-align: center;
                padding: 20px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 30px;
                text-align: center;
                color: #333333;
            }
            .content p {
                font-size: 16px;
                line-height: 1.6;
                color: #555555;
            }
            .button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 25px;
                background-color: #4CAF50;
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                font-weight: bold;
                border-radius: 5px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #45a049;
            }
            .footer {
                background-color: #f1f1f1;
                color: #777777;
                text-align: center;
                padding: 15px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
            </div>
            <div class="content">
                <h2>Hello there!</h2>
                <p>${text}</p>
                <div class="button">${code}</div>
                <p style="margin-top: 30px; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} A2Z Decoration. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;
};

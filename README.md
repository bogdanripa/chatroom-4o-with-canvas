<div align="center"> <a href="https://genezio.com/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/genez-io/graphics/raw/HEAD/svg/Icon_Genezio_White.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/genez-io/graphics/raw/HEAD/svg/Icon_Genezio_Black.svg">
    <img alt="genezio logo" src="https://github.com/genez-io/graphics/raw/HEAD/svg/Icon_Genezio_Black.svg" height="100" >
  </picture>
 </div>

<div align="center">

[![Join our community](https://img.shields.io/discord/1024296197575422022?style=social&label=Join%20our%20community%20&logo=discord&labelColor=6A7EC2)](https://discord.gg/uc9H5YKjXv)
[![Follow @geneziodev](https://img.shields.io/twitter/url/https/twitter.com/geneziodev.svg?style=social&label=Follow%20%40geneziodev)](https://twitter.com/geneziodev)

</div>

# Chatroom implementation 
This is a Genezio project that implements a basic chat room, where visitors choose a nickname and chat with each other. The goal of this project is to show how socket.io can be used with Genezio's serverless infrastructure.

The code was generated using OpenAI's ChatGPT "4o with canvas" model, with slight manual adjustments.

Check the client/ folder for the client-side, and the server/ for the server-side. The app needs redis for multiple socket.io instances to communicate with each other.

## Set-up
Once deployed (see the next section on how to do this), go to your project / Integrations / UPSTASH-REDIS and enable Redis. This will create some environment variables that are required for the app to run properly.

# Deploy
:rocket: You can deploy your own version of this app with one click:

[![Deploy to Genezio](https://raw.githubusercontent.com/Genez-io/graphics/main/svg/deploy-button.svg)](https://app.genez.io/start/deploy?repository=https://github.com/bogdanripa/chatroom-4o-with-canvas)

***

<div align="center"> <a href="https://genezio.com/">
  <p>Built with Genezio with ❤️ </p>
  <img alt="genezio logo" src="https://raw.githubusercontent.com/Genez-io/graphics/main/svg/powered_by_genezio.svg" height="40">
</div>

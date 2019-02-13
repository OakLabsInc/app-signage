# Signage Application and Admin

This project has two parts. The first part is the Firebase hosted admin web page. The second part is an OakOS application container that displays the Firebase data that the admin page stores for a gallery.
## Commands

First command to run is:

> ```npm run rebuild```

To run firebase commands you will need some firebase tools:

> ```npm install -g firebase-tools```

To run the firebase server locally run:

> ```firebase serve```

To deploy the application to the firebase hosting service run:

> ```firebase deploy --only hosting```

To compile the local `pug` and `stylus` files for the admin run:

> ```npm run gulp```

To run the project application in electron locally run:

> ```npm run dev```

## Firebase Admin Web Page

Go to the [Admin Page](https://signage.zivelo.com). Once you login with either a Google hosted account or just a plain email, your data produced by this web page will be stored under your own user identification (api key). That api key will be displayed on the default web page.

## Settings

Next, create a gallery and set any needed settings.

* `Slide Per View` is how many slides will show on the screen at one time. 
* `Slides Per Group` is how many slides will be scrolled at once.
* `Enable Autoplay` sets the gallery to autoplay and loop continuously.
* `Show Navigation` when unchecked will hide both the arrows and the pagination dots at the bottom.

## Slides

You can now add slides.

* `Slide Delay` settings applied to an individual slide will override the default delay in the gallery settings.
* `Slide Background Color` settings will override the gallery background color for that slide.
* `Text Color` is the overlay default text color.
* `Overlay Position` positions the text area around the slide.
* `Overlay Title` is optional and can be configured in the `Overlay Text`
* `Overlay Text` accepts [Markdown](https://www.markdownguide.org/cheat-sheet/). Overflow of text will be hidden.
* `Overlay Background` is the background color for the overlay box area. This color can have an alpha channel to allow background transparency.
* `Position` adjusts that slides position in the slide list. Zero is the first in the list.

## Preview

A facimile of your gallery will be shouwn in this tab.

`Remember to save your changes`

## Oak Application

In order to install this application onto an OakOS enabled device , you must send some environmental variable that tell the application what user and gallery to use in the app. To do this send this install payload to the host machine:

```json
{
  "services": [
    {
      "image": "index.docker.io/oaklabs/app-signage:release-1.0.9",
      "username": "{{dockerUsername}}",
      "password": "{{dockerPassword}}",
      "environment": {
        "API_KEY": "{{apiKey}}",
        "GALLERY_NAME": "{{galleryName}}"
      }
    }
  ]
}
```

After authenticating to the [Admin Page](https://signage.zivelo.com) you will see your `apiKey` on the home page. The `galleryName` variable is shown in the settings under the `Gallery Name` field. You will need to have access to dockerhub with the `dockerUsername` and `dockerPassword`.
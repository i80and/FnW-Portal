import React, { Component } from "react";
import ReactDOM from "react-dom";

import LightPanelDesktop from "./LightPanel/LightPanelDesktop";
import LightPanelMobile from "./LightPanel/LightPanelMobile";

import '../css/main.css';
import '../css/crt.css';

import { isMobile } from "react-device-detect";

class Container extends React.Component {

    renderContent = () => {
        if (isMobile) {
            return <div className={"crt"}> <LightPanelMobile /> </div>;
        } else {
            return <div className={"crt"}> <LightPanelDesktop /> </div>;
        }
    }

    render() {
        return this.renderContent();
    }

}

const rootElement = document.getElementById("root");
ReactDOM.render(<Container />, rootElement);

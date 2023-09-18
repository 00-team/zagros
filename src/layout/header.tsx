import { Logo } from 'icon'

import './style/header.scss'

const Header = () => {
    return (
        <div class='header'>
            <div class='logo'>
                <Logo />
            </div>
            <div class='status'>hi from Zagros</div>
            <div></div>
        </div>
    )
}

export { Header }

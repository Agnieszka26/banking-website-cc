import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'

const Footer = () => {
  return (
   <footer className='w-full bg-gray-100 fixed bottom-0'>
    <div>
        <nav className='flex items-center justify-between'>
            <Button>Logo</Button>
            <ul className='flex items-center gap-4'>    
                <li>
                    <Link to="/">Bezpieczeństwo</Link>
                </li>
                <li>
                    <Link to="/">Regulaminy</Link>
                </li>
                <li>
                    <Link to="/">Polityka prywatności</Link>
                </li>
                <li>
                    <Link to="/">Deklaracja dostępności</Link>
                </li>
       
            </ul>
            <Button>Logo</Button>
        </nav>
    </div>
   </footer>
  )
}

export default Footer
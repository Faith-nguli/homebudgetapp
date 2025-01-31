import React from 'react';
import { Wallet } from 'lucide-react'; // Or your preferred icon library
import { useNavigate } from 'react-router-dom';


const Navbar = () => {
    const navigate = useNavigate();
  return (
    <nav>
      <div className="navbar-content"> {/* Added class for logo and text */}
        <div className="logo-icon"> {/* Added class for icon container */}
          <Wallet /> {/* Your icon component here */}
        </div>
        <span className="logo-text">WALLY'S Budget</span> {/* Added class for text */}

      </div>
    </nav>
  );
}

export default Navbar;
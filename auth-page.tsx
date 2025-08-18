// src/auth-page.tsx 
import React, { useState } from 'react'; 
import { supabase } from './supabaseClient'; 
 
const AuthPage = () =
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [message, setMessage] = useState(''); 
 
    const handleSignUp = async () =
        const { data, error } = await supabase.auth.signUp({ email, password }); 
        if (error) setMessage(error.message); 
        else setMessage('Signup successful! Check your email for confirmation.'); 
    }; 
 
    const handleLogin = async () =
        const { data, error } = await supabase.auth.signInWithPassword({ email, password }); 
        if (error) setMessage(error.message); 
        else setMessage('Login successful!'); 
    }; 
 
    return ( 
    ); 
}; 
 
export default AuthPage; 

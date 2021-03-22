import React from 'react';
import Viewer from '../../components/viewer'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import images from '../../assets/images'

const Home = () => {
    const [numberOfImages, setNumberOfImages] = useState(1)
    const [imagePath, setImagePath] = useState('https://d1iddyy6okui5n.cloudfront.net/360view')
    const [pins, setPins] = useState([])
    const claim_id = window.location.search ? window.location.search : ''
    const getData=()=>{
        fetch('pins.json'
        ,{
          headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
           }
        }
        ).then(response =>response.json())
        .then(response => setPins(response))
          
      }
      useEffect(()=>{
        getData()
      },[])
    useEffect(() => {
        const api = `https://www.scans.ai/CarscanUserDto/getcarspin?claim_number=${claim_id.substring(1)}`
        fetch(
          api,
          {
            method: "GET",
            headers: {
                'X-Api-Key': 'asoidewfoef',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
          }
        )
        .then(res => res.json())
        .then(response => {
            console.log(response);
            setImagePath(response.urllinks.baseimagepath.slice(0, -1))
            setNumberOfImages(response.urllinks.noofimages)
        })
        .catch(error => console.log(error))
    }, [claim_id])

    return (
        <Wrapper>
            <LogoWrapper>
                <Logo src={images.LOGO} alt="logo" />
            </LogoWrapper>
           
            <SpinViewWrapper className="image-viewer">
                <Viewer pinss={pins} inverse={true} autoplaySpeed={250} location={imagePath} format="png" count={numberOfImages} showControlBar />
            </SpinViewWrapper>
        </Wrapper>
    )
}

const Wrapper = styled.div`
    max-width: 500px;
    margin: 0 auto;
    .icons {
        position: absolute;
        top: 121px;
        background-color: rgba(232, 236, 241, 0.7);
        padding: 6px;
        
    }
    .icons-full-screen {
        position: absolute;
        top: 0px;
        left: 0px;
        background-color: rgba(232, 236, 241, 0.7);
        padding: 6px;
    }
    .hide {
        display:none;
    }
    .user-guide {
        height:375px;
        width: 500px;
        position: absolute;
        top: 121px;
        display: flex;
        justify-content: center;
        align-items: center;
        @media (max-width: 480px) {
            width: 100%;
            font-size: 10px;
          }
        .drag-guide {
            display: flex;
            background: #fbfbfb;
            padding: 10px;
            border-radius: 30px;
            align-items: center;
            .drag-image {
                height: auto;
                width: 75px;
            }
        }
    }
`
const Logo = styled.img`
    width: 200px;
`

const LogoWrapper = styled.header`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px 10px;
`
const ICON = styled.img`
    height: 25px;
    width: 25px;
    margin: 0px 5px;
`
const SpinViewWrapper = styled.div`
    
`

export default Home
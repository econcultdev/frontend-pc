import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSpring, animated } from 'react-spring';
import styled from 'styled-components';
import { MdClose } from 'react-icons/md';
import { ModalBody, ModalFooter } from 'reactstrap';

const Background = styled.div`
top: 0px;
right: 0px;
bottom: 0px;
left: 0px;
background: rgba(0, 0, 0, 0.8);
position: fixed;
display: flex;
justify-content: center;
align-items: center;
z-index: 1000;
`;

const ModalWrapper = styled.div`
  min-width: 500px;
  min-height: 300px;
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.2);
  background: #fff;
  color: #000;
  display: grid;
  position: relative;
  z-index: 10;
  border-radius: 10px;
`;

const ModalImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 10px 0 0 10px;
  background: #000;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 1.8;
  color: #141414;
  p {
    margin-bottom: 1rem;
  }
  button {
    padding: 10px 24px;
    background: #141414;
    color: #fff;
    border: none;
  }
  .modal-body {
      flex: 0;
      width: 80%
  }
`;

const CloseModalButton = styled(MdClose)`
  cursor: pointer;
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  padding: 0;
  z-index: 10;
`;

const ModalPro = (props) => {
    const { showModal, setShowModal, titleHeader, saveButtonText, currentValue, image, showTextArea } = props;
    const [currentValueInput, setCurrentValueInput] = useState(currentValue);
    const modalRef = useRef();

    const animation = useSpring({
        config: {
            duration: 250
        },
        opacity: showModal ? 1 : 0,
        transform: showModal ? `translateY(0%)` : `translateY(-100%)`
    });

    const closeModal = e => {
        if (modalRef.current === e.target) {
            setShowModal(false);
        }
    };

    const keyPress = useCallback(
        e => {
            if (e.key === 'Escape' && showModal) {
                setShowModal(false);
            }
        },
        [setShowModal, showModal]
    );

    useEffect(
        () => {
            document.addEventListener('keydown', keyPress);
            return () => document.removeEventListener('keydown', keyPress);
        },
        [keyPress]
    );

    const saveAction = (event) => {
        event.preventDefault();
        props.onReturn(currentValueInput);
        setShowModal(prev => !prev);
    }

    return (
        <>
            {showModal ? (
                <Background onClick={closeModal} ref={modalRef}>
                    <animated.div style={animation}>
                        <ModalWrapper showModal={showModal}>
                            <ModalContent>
                                <h1>{titleHeader}</h1>
                                {image && <ModalImg></ModalImg>}
                                <ModalBody>
                                    {!showTextArea &&
                                        <input className="form-control" type="text" maxLength="255" value={currentValueInput ? currentValueInput : ''}
                                            onChange={(e) => {
                                                e.preventDefault();
                                                setCurrentValueInput(e.target.value);
                                            }} />
                                    }
                                    {showTextArea &&
                                        <textarea
                                            className="form-control"
                                            type="text"
                                            value={currentValueInput ? currentValueInput : ''}
                                            name="resumen"
                                            rows="3" cols="80"
                                            onChange={(e) => {
                                                e.preventDefault();
                                                setCurrentValueInput(e.target.value);
                                            }}
                                        />
                                    }
                                </ModalBody>
                                <ModalFooter style={{ border: 0 }}>
                                    <button className='btn btn-primary' variant="primary" onClick={(e) => saveAction(e)} >
                                        {saveButtonText}
                                    </button>
                                </ModalFooter>
                            </ModalContent>
                            <CloseModalButton aria-label='Close modal' onClick={(event) => { setShowModal(prev => !prev); event.preventDefault(); }} />
                        </ModalWrapper>

                    </animated.div>
                </Background>
            ) : null}
        </>
    );
};

export default ModalPro;
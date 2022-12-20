/**
 * Componente modal
 */

import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';


const closeText = () => {
    const { t } = this.props;
    return t('MODALACTION.CLOSE');
}

// class ModalAction extends React.Component {
//     state = {
//         showModalActionClose: false,
//         header: undefined,
//         body: undefined,
//         show: false,
//         closeText: undefined
//     }
//     render() {

//         const { t } = this.props;
//         // this.setState({
//         //     showModalActionClose: this.props.showModalActionClose,
//         //     closeText: t('MODALACTION.CLOSE'),
//         //     header: this.header,
//         //     body: this.props.body,
//         //     show: this.props.body
//         // });

//         return (
//             <Modal isOpen={this.state.show}>
//                 <ModalHeader>
//                     {this.state.header}
//                 </ModalHeader>
//                 <ModalBody>{this.state.body}</ModalBody>
//                 <ModalFooter>
//                     <Button color="info" onClick={this.state.showModalActionClose}></Button>
//                 </ModalFooter>
//             </Modal>
//         );
//     }
// }

// export default withTranslation('global')(ModalAction);

const ModalAction = ({ showModalActionClose, header, body, show, errorMessage }) => {
    return (
        <Modal isOpen={show}>
            <ModalHeader>
                {header}
            </ModalHeader>
            <ModalBody>
                {body}
                {errorMessage &&
                    <h4 style={{ color: 'red' }}>{errorMessage}</h4>
                }
            </ModalBody>
            <ModalFooter>
                <Button color="info" onClick={showModalActionClose}>Close</Button>
            </ModalFooter>
        </Modal>
    );
};

export default ModalAction;
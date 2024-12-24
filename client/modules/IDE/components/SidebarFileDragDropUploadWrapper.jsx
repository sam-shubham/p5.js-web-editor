import Dropzone from 'dropzone';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { fileExtensionsAndMimeTypes } from '../../../../server/utils/fileUtils';
import {
  dropzoneAcceptCallback,
  dropzoneCompleteCallback,
  dropzoneSendingCallback,
  s3BucketHttps
} from '../actions/uploader';
import { selectActiveFile, selectRootFile } from '../selectors/files';
import { initSidebarUpload } from '../actions/ide';

Dropzone.autoDiscover = false;

// Styled Components
const Wrapper = styled.div`
  height: 100%;
  display: flex;
  position: relative;
`;

const HiddenInputContainer = styled.div``;

const DraggingOverMessage = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.85);
  display: none;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 1rem;
  font-weight: semibold;
  transition: background-color 0.3s ease;
`;

function SidebarFileDragDropUploadWrapper({ children }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.id);

  const rootFile = useSelector(selectRootFile);
  const activeFile = useSelector(selectActiveFile);

  useEffect(() => {
    dispatch(
      initSidebarUpload(
        activeFile.fileType === 'folder' ? activeFile.id : rootFile.id
      )
    );

    let dragCounter = 0;

    const uploader = new Dropzone('div#sidebar-file-drag-drop-upload-wrapper', {
      url: s3BucketHttps,
      method: 'post',
      autoProcessQueue: false,
      clickable: false,
      hiddenInputContainer: '#sidebar-hidden-input-container',
      maxFiles: 6,
      parallelUploads: 1,
      maxFilesize: 5, // in MB
      maxThumbnailFilesize: 8, // in MB
      thumbnailWidth: 10,
      previewsContainer: false,
      thumbnailHeight: 10,
      acceptedFiles: fileExtensionsAndMimeTypes,
      dictDefaultMessage: t('FileUploader.DictDefaultMessage'),
      accept: (file, done) => {
        dropzoneAcceptCallback(userId, file, done);
      },
      sending: dropzoneSendingCallback
    });

    uploader.on('complete', (file) => {
      dispatch(dropzoneCompleteCallback(file));
    });

    uploader.on('dragenter', () => {
      dragCounter += 1;
      document.getElementById('dragging-over-message').style.display = 'flex';
    });

    uploader.on('dragleave', () => {
      dragCounter -= 1;

      if (dragCounter <= 0) {
        dragCounter = 0;
        document.getElementById('dragging-over-message').style.display = 'none';
      }
    });

    uploader.on('drop', () => {
      dragCounter = 0;
      document.getElementById('dragging-over-message').style.display = 'none';
    });

    return () => {
      uploader.off('complete');
      uploader.off('dragenter');
      uploader.off('dragleave');
      uploader.off('drop');
      uploader.destroy();
    };
  }, [userId, dispatch, t, activeFile]);

  return (
    <Wrapper id="sidebar-file-drag-drop-upload-wrapper">
      <HiddenInputContainer id="sidebar-hidden-input-container" />
      {children}
      <DraggingOverMessage id="dragging-over-message">
        {t('FileUploader.DictDefaultMessage')}
      </DraggingOverMessage>
    </Wrapper>
  );
}

SidebarFileDragDropUploadWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default SidebarFileDragDropUploadWrapper;

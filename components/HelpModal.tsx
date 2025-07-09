import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
    <ul className="space-y-2 list-disc list-inside text-slate-600">
      {children}
    </ul>
  </div>
);

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 transform transition-all" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <h2 id="help-title" className="text-xl font-semibold text-slate-800">사용법 안내</h2>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <HelpSection title="게시판 사용법">
            <li><strong className="font-semibold text-slate-700">열기:</strong> 바탕화면의 '게시판' 폴더를 클릭하여 앱을 실행합니다.</li>
            <li><strong className="font-semibold text-slate-700">새 글 작성:</strong> 게시판 좌측 하단의 '새 게시물 작성' 버튼을 누르거나, 상단 메뉴에서 '파일 &gt; 새 게시물...'을 선택하세요.</li>
            <li><strong className="font-semibold text-slate-700">글 선택:</strong> 중앙 목록에서 게시물을 클릭하여 내용을 확인합니다.</li>
            <li><strong className="font-semibold text-slate-700">글 수정/삭제:</strong> 게시물을 선택한 후, 상단 메뉴에서 '편집 &gt; 수정...' 또는 '편집 &gt; 삭제'를 선택하세요.</li>
            <li><strong className="font-semibold text-slate-700">글 이동:</strong> 게시물을 선택한 후, '편집 &gt; 게시물 이동' 메뉴를 통해 다른 카테고리로 옮길 수 있습니다.</li>
          </HelpSection>
          
          <HelpSection title="바탕화면 사용법">
            <li><strong className="font-semibold text-slate-700">아이콘 선택:</strong> 바탕화면의 아이콘을 클릭하여 선택합니다.</li>
            <li><strong className="font-semibold text-slate-700">게시판 열기:</strong> '게시판' 아이콘을 클릭하면 게시판 앱이 열립니다.</li>
          </HelpSection>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
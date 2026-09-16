import streamlit as st
import random

st.set_page_config(page_title="묵찌빠 게임", page_icon="✊")

st.title("✊ ✌️ 🖐️ 묵찌빠 게임")

# 세션 상태 초기화
if "attacker" not in st.session_state:
    st.session_state.attacker = None

if "message" not in st.session_state:
    st.session_state.message = "아래 버튼을 눌러 게임을 시작하세요!"

if "player_score" not in st.session_state:
    st.session_state.player_score = 0

if "computer_score" not in st.session_state:
    st.session_state.computer_score = 0


hands = {
    "묵": "✊",
    "찌": "✌️",
    "빠": "🖐️"
}


def rps_winner(player, computer):
    """가위바위보 승자 반환"""
    if player == computer:
        return "draw"

    if (
        (player == "묵" and computer == "찌")
        or (player == "찌" and computer == "빠")
        or (player == "빠" and computer == "묵")
    ):
        return "player"

    return "computer"


def play(player_hand):
    computer_hand = random.choice(list(hands.keys()))

    # 아직 공격자가 없으면 가위바위보로 공격자 결정
    if st.session_state.attacker is None:
        result = rps_winner(player_hand, computer_hand)

        if result == "draw":
            st.session_state.message = (
                f"컴퓨터: {hands[computer_hand]} {computer_hand}\n\n"
                "🤝 무승부! 다시 내세요."
            )
        elif result == "player":
            st.session_state.attacker = "player"
            st.session_state.message = (
                f"컴퓨터: {hands[computer_hand]} {computer_hand}\n\n"
                "🎯 당신이 공격자입니다! 묵찌빠를 시작하세요."
            )
        else:
            st.session_state.attacker = "computer"
            st.session_state.message = (
                f"컴퓨터: {hands[computer_hand]} {computer_hand}\n\n"
                "💻 컴퓨터가 공격자입니다! 묵찌빠를 시작하세요."
            )

        return

    # 묵찌빠 진행
    attacker = st.session_state.attacker

    if player_hand == computer_hand:
        # 같은 손이면 공격자가 승리
        if attacker == "player":
            st.session_state.player_score += 1
            st.session_state.message = (
                f"컴퓨터: {hands[computer_hand]} {computer_hand}\n\n"
                "🎉 같은 손! 당신의 승리입니다!"
            )
        else:
            st.session_state.computer_score += 1
            st.session_state.message = (
                f"컴퓨터: {hands[computer_hand]} {computer_hand}\n\n"
                "💻 같은 손! 컴퓨터의 승리입니다!"
            )

        st.session_state.attacker = None

    else:
        # 공격자 변경
        result = rps_winner(player_hand, computer_hand)

        if result == "player":
            st.session_state.attacker = "player"
            st.session_state.message = (
                f"컴퓨터: {hands[computer_hand]} {computer_hand}\n\n"
                "🔥 당신이 공격권을 가져왔습니다!"
            )
        else:
            st.session_state.attacker = "computer"
            st.session_state.message = (
                f"컴퓨터: {hands[computer_hand]} {computer_hand}\n\n"
                "💻 컴퓨터가 공격권을 가져갔습니다!"
            )


# 현재 상태 표시
if st.session_state.attacker == "player":
    st.info("🎯 현재 공격자: 당신")
elif st.session_state.attacker == "computer":
    st.warning("💻 현재 공격자: 컴퓨터")
else:
    st.info("⚔️ 가위바위보로 공격자를 정합니다.")

st.markdown("---")

# 버튼
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("✊ 묵", use_container_width=True):
        play("묵")

with col2:
    if st.button("✌️ 찌", use_container_width=True):
        play("찌")

with col3:
    if st.button("🖐️ 빠", use_container_width=True):
        play("빠")

st.markdown("---")

# 결과
st.write(st.session_state.message)

# 점수
st.subheader("🏆 점수")
score1, score2 = st.columns(2)

with score1:
    st.metric("나", st.session_state.player_score)

with score2:
    st.metric("컴퓨터", st.session_state.computer_score)


# 리셋
if st.button("🔄 게임 초기화", use_container_width=True):
    st.session_state.attacker = None
    st.session_state.message = "아래 버튼을 눌러 게임을 시작하세요!"
    st.session_state.player_score = 0
    st.session_state.computer_score = 0
    st.rerun()

package com.dev2gether.dto;

public record ChatMessage(
        String roomId,
        String sender,
        String text,
        Long time
) {

}
